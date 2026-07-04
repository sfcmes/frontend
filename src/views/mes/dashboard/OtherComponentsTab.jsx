// [MES] OtherComponentsTab — "ชิ้นงานอื่นๆ": quantity-tracked components per project.
// Business logic (transitions, validation, role gates) preserved verbatim from the
// previous implementation; ApexCharts replaced with token-driven SVG donuts.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from 'src/components/mes/Icon';
import { Donut } from 'src/components/mes/charts';
import { COMPONENT_STATUS, fmt, pct } from 'src/components/mes/status-meta';
import { Modal, EmptyState, Spinner, useToast } from 'src/components/mes/ui';
import { fetchProjectsWithOtherComponents, updateOtherComponentStatus } from 'src/utils/api';
import tiebeamIcon from 'src/assets/card-icons/tiebeam.gif';
import carstopIcon from 'src/assets/card-icons/carstop.gif';
import holeIcon from 'src/assets/card-icons/hole.gif';
import otherIcon from 'src/assets/card-icons/other.gif';

const STATUSES = ['planning', 'manufactured', 'transported', 'rejected'];

// Each key lists the only valid destination statuses from that source.
const VALID_TRANSITIONS = {
  planning: ['manufactured', 'rejected'],
  manufactured: ['transported', 'rejected', 'planning'],
  transported: ['rejected', 'manufactured', 'planning'],
  rejected: ['transported'],
};

function getProjectIcon(projectCode = '') {
  if (projectCode.startsWith('เสาเอ็น')) return tiebeamIcon;
  if (projectCode.startsWith('คันกั้นล้อ')) return carstopIcon;
  if (projectCode.startsWith('บ่อ')) return holeIcon;
  return otherIcon;
}

// Product-type label for the card chip — buckets mirror getProjectIcon so the
// icon and chip always agree. Cards here are titled by building name, which
// reads like a precast project; the chip names the ชิ้นงานอื่นๆ product type.
function getProjectType(projectCode = '') {
  if (projectCode.startsWith('เสาเอ็น')) return 'เสาเอ็น';
  if (projectCode.startsWith('คันกั้นล้อ')) return 'คันกั้นล้อ';
  if (projectCode.startsWith('บ่อ')) return 'บ่อล้างล้อรถ';
  return 'อื่นๆ';
}

function validateUpdate(component, fromStatus, toStatus, rawQty) {
  if (!fromStatus || !toStatus) return 'กรุณาเลือกสถานะต้นทางและปลายทาง';
  if (fromStatus === toStatus) return 'สถานะต้นทางและปลายทางต้องไม่เหมือนกัน';
  const qty = parseInt(rawQty, 10);
  if (isNaN(qty) || qty <= 0) return 'จำนวนต้องเป็นตัวเลขที่มากกว่า 0';
  const available = component.statuses[fromStatus] || 0;
  if (qty > available)
    return `จำนวนเกินกว่าที่มีในสถานะ "${COMPONENT_STATUS[fromStatus].th}" (มีอยู่ ${available} ชิ้น)`;
  if (!VALID_TRANSITIONS[fromStatus]?.includes(toStatus))
    return `ไม่สามารถเปลี่ยนสถานะจาก "${COMPONENT_STATUS[fromStatus].th}" ไปยัง "${COMPONENT_STATUS[toStatus].th}" ได้`;
  return null;
}

function UpdateForm({ component, onSubmit, busy }) {
  const [fromStatus, setFromStatus] = useState('');
  const [toStatus, setToStatus] = useState('');
  const [qty, setQty] = useState('');
  const [error, setError] = useState(null);

  const submit = async () => {
    const err = validateUpdate(component, fromStatus, toStatus, qty);
    if (err) { setError(err); return; }
    setError(null);
    try {
      await onSubmit(component.id, fromStatus, toStatus, parseInt(qty, 10));
      setFromStatus(''); setToStatus(''); setQty('');
    } catch {
      /* toast handled upstream */
    }
  };

  return (
    <div className="mt-3 rounded-md border border-mes-border bg-mes-surface-2 p-3">
      <div className="text-sm font-semibold">อัปเดตสถานะ</div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <label className="mes-label">จากสถานะ</label>
          <select className="mes-input" value={fromStatus} onChange={(e) => { setFromStatus(e.target.value); setError(null); }}>
            <option value="">—</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {COMPONENT_STATUS[s].th} ({component.statuses[s] || 0} คงเหลือ)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mes-label">ไปยังสถานะ</label>
          <select className="mes-input" value={toStatus} onChange={(e) => { setToStatus(e.target.value); setError(null); }}>
            <option value="">—</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{COMPONENT_STATUS[s].th}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mes-label">จำนวน</label>
          <input className="mes-input" type="number" min="1" inputMode="numeric" value={qty}
            onChange={(e) => { setQty(e.target.value); setError(null); }} />
        </div>
      </div>
      {error && <div className="mt-2 text-xs font-medium text-sem-danger">{error}</div>}
      <button className="mes-btn mes-btn-primary mt-3 w-full sm:w-auto" onClick={submit} disabled={busy}>
        {busy ? 'กำลังบันทึก…' : 'บันทึก'}
      </button>
    </div>
  );
}

function ComponentRow({ component, isAdmin, onUpdate, busy }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-mes-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{component.name}</span>
        <span className="ml-auto text-xs text-mes-muted tabular-nums">ชิ้นงานทั้งหมด {fmt(component.total)} ชิ้น</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => {
          const m = COMPONENT_STATUS[s];
          const v = component.statuses[s] || 0;
          return (
            <div key={s} className="flex items-center gap-2">
              <Donut
                segments={[
                  { value: v, cssVar: m.cssVar },
                  { value: Math.max(0, component.total - v), cssVar: '--mes-surface-2' },
                ]}
                size={44} thickness={6}
              >
                <span className="text-[9px] font-bold tabular-nums">{pct(v, component.total || 1).toFixed(0)}%</span>
              </Donut>
              <div className="min-w-0">
                <div className="truncate text-xs text-mes-muted">{m.th}</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: `var(${m.cssVar})` }}>{fmt(v)}</div>
              </div>
            </div>
          );
        })}
      </div>
      {isAdmin ? (
        <>
          <button className="mes-btn mes-btn-ghost mt-3 w-full sm:w-auto !min-h-touch md:!min-h-0 md:!py-1.5 text-xs" onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} /> อัปเดตสถานะ
          </button>
          {open && <UpdateForm component={component} onSubmit={onUpdate} busy={busy} />}
        </>
      ) : (
        <div className="mt-3 text-xs text-mes-muted">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถอัปเดตสถานะได้</div>
      )}
    </div>
  );
}

export default function OtherComponentsTab({ userRole }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const { showToast, toastNode } = useToast();

  const isAdmin = userRole === 'Admin';
  const isLoggedIn = !!localStorage.getItem('token');

  const loadProjects = useCallback(async (currentSelectedId = null) => {
    try {
      setFetchError(null);
      const data = await fetchProjectsWithOtherComponents();
      setProjects(data);
      if (currentSelectedId !== null) {
        const refreshed = data.find((p) => p.id === currentSelectedId);
        if (refreshed) setSelectedProject(refreshed);
      }
    } catch {
      setFetchError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleUpdateStatus = useCallback(
    async (componentId, fromStatus, toStatus, quantity) => {
      if (!isLoggedIn) {
        showToast('กรุณาเข้าสู่ระบบก่อนอัปเดตสถานะ', 'warn');
        throw new Error('Not authenticated');
      }
      if (!isAdmin) {
        showToast('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถอัปเดตสถานะได้', 'error');
        throw new Error('Permission denied');
      }
      setBusy(true);
      try {
        await updateOtherComponentStatus(componentId, fromStatus, toStatus, quantity);
        await loadProjects(selectedProject?.id ?? null);
        showToast('อัปเดตสถานะสำเร็จ');
      } catch (err) {
        showToast('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง', 'error');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [isLoggedIn, isAdmin, loadProjects, selectedProject?.id, showToast],
  );

  const visibleProjects = useMemo(
    () => projects.filter((p) => p.components && p.components.length > 0),
    [projects],
  );

  if (loading) return <Spinner />;

  if (fetchError) {
    return (
      <EmptyState
        icon="alert-triangle"
        title={fetchError}
        action={<button className="mes-btn mes-btn-ghost" onClick={() => { setLoading(true); loadProjects(); }}>ลองอีกครั้ง</button>}
      />
    );
  }

  if (visibleProjects.length === 0) {
    return <EmptyState icon="box" title="ไม่พบโครงการที่มีชิ้นงานอื่นๆ" />;
  }

  return (
    <div className="p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map((p) => {
          const total = p.components.reduce((s, c) => s + (c.total || 0), 0);
          return (
            <button
              key={p.id}
              className="mes-card flex items-center gap-3 p-3 text-left hover:border-mes-accent transition-colors"
              onClick={() => { setSelectedProject(p); setModalOpen(true); }}
            >
              <img src={getProjectIcon(p.project_code || p.name)} alt="" className="h-10 w-10 rounded-sm object-cover" />
              <div className="min-w-0 grow">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded-sm bg-mes-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-mes-muted">
                    {getProjectType(p.project_code || p.name)}
                  </span>
                  <span className="min-w-0 truncate text-sm font-semibold">{p.name}</span>
                </div>
                <div className="mt-0.5 text-xs text-mes-muted tabular-nums">
                  {p.components.length} ประเภท · ทั้งหมด {fmt(total)} ชิ้น
                </div>
              </div>
              <Icon name="chevron-right" size={16} className="shrink-0 text-mes-muted" />
            </button>
          );
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedProject?.name || ''}
        wide
      >
        <div className="flex flex-col gap-3">
          {(selectedProject?.components || []).map((c) => (
            <ComponentRow key={c.id} component={c} isAdmin={isAdmin} onUpdate={handleUpdateStatus} busy={busy} />
          ))}
        </div>
      </Modal>
      {toastNode}
    </div>
  );
}
