// [MES] ProjectDrawer — full project detail: ภาพรวม / ชิ้นงาน / ใบสั่งซื้อ.
// Data flow identical to previous implementation (sections+components+POs on open,
// enriched project pushed up via onDataLoaded). PR/Issues mock tabs removed (ADR-0005).
// Piece QR is a real scannable code (qrcode.react), not the old decorative pattern.
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from 'src/components/mes/Icon';
import { Donut, PipelineBar, Timeline } from 'src/components/mes/charts';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import {
  COMPONENT_STATUS, PIPE_ORDER, resolveComponentStatus,
  emptyStatus, fmt, pct,
} from 'src/components/mes/status-meta';
import { EmptyState, Modal, Spinner } from 'src/components/mes/ui';
import {
  fetchSectionsByProjectId, fetchComponentsByProjectId, updateComponentStatus,
  fetchComponentsBySectionId, fetchComponentById, fetchPOsByProject,
} from 'src/utils/api';

// Natural numeric compare for Thai/Latin mixed names: 1, 1R1, 2, … 10 (not 1, 10, 2).
const numericCompare = (a, b) =>
  String(a ?? '').localeCompare(String(b ?? ''), 'th', { numeric: true });

/* ---- Per-piece detail overlay ---- */
function PieceDetail({ piece, project, onClose, onStatusUpdated }) {
  const [sub, setSub] = useState('detail');
  const [newStatus, setNewStatus] = useState(piece.status);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState(null);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    if (sub !== 'history' || history !== null) return;
    setHistLoading(true);
    fetchComponentById(piece.id)
      .then((res) => setHistory(Array.isArray(res.history) ? res.history : []))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [sub, history, piece.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateComponentStatus(piece.id, newStatus, 'ผู้ใช้งาน');
      setSaved(true);
      onStatusUpdated?.();
    } catch (err) {
      setSaved(false);
      setSaveError(err?.message || 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  const uuid = String(piece.id || `SFC-${piece.code || ''}`);
  const SUBS = [
    { id: 'detail', label: 'รายละเอียดชิ้นงาน', icon: 'cube' },
    { id: 'history', label: 'ประวัติสถานะ', icon: 'clock' },
    { id: 'files', label: 'ไฟล์', icon: 'file-text' },
  ];

  const prop = (icon, label, value) => (
    <div className="flex items-center gap-2 border-b border-mes-border py-2 text-sm last:border-0">
      <span className="text-mes-muted"><Icon name={icon} size={15} /></span>
      <span className="text-mes-muted">{label}</span>
      <span className="ml-auto font-medium tabular-nums">{value || '—'}</span>
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={piece.name || piece.code || piece.component_code || '—'}
      wide
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-mes-muted">{piece.type || 'ชิ้นงานพรีคาสท์'}</span>
        <StatusBadge status={piece.status} className="ml-auto" />
      </div>

      <div className="flex flex-col items-center gap-3 rounded-md border border-mes-border p-4 sm:flex-row">
        <div className="rounded-sm bg-mes-text p-2">
          <QRCodeSVG value={uuid} size={110} bgColor="var(--mes-text)" fgColor="var(--mes-bg)" />
        </div>
        <div className="w-full min-w-0 text-sm">
          <div className="flex justify-between gap-3 border-b border-mes-border py-1.5">
            <span className="text-mes-muted">รหัสชิ้นงาน</span>
            <b className="truncate">{piece.name || piece.code || '—'}</b>
          </div>
          <div className="flex justify-between gap-3 border-b border-mes-border py-1.5">
            <span className="text-mes-muted">ID</span>
            <b className="truncate font-mono text-xs">{String(piece.id || '').slice(0, 18) || '—'}</b>
          </div>
          <div className="flex justify-between gap-3 py-1.5">
            <span className="text-mes-muted">โครงการ</span>
            <b className="truncate">{project.code}</b>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-mes-border">
        {SUBS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`flex min-h-touch items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm font-semibold -mb-px ${
              sub === s.id ? 'border-mes-accent text-mes-accent' : 'border-transparent text-mes-muted'
            }`}
          >
            <Icon name={s.icon} size={15} /> {s.label}
          </button>
        ))}
      </div>

      {sub === 'detail' && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-mes-muted">คุณสมบัติ</div>
          <div className="mt-1">
            {prop('cube', 'ประเภทชิ้นงาน', piece.type)}
            {prop('ruler', 'ขนาด ก×ย×หนา (มม.)', piece.width && piece.height
              ? `${piece.width} × ${piece.height} × ${piece.thickness || '—'}`
              : '—')}
            {prop('photo', 'พื้นที่', piece.area ? `${piece.area} m²` : '—')}
            {prop('box', 'ปริมาตร', piece.volume ? `${piece.volume} m³` : '—')}
            {prop('weight', 'น้ำหนัก', piece.weight ? `${piece.weight} ตัน` : '—')}
            {prop('hash', 'ชั้น / Section', piece.section_name || '—')}
          </div>

          <div className="mt-4 text-xs font-semibold text-mes-muted">อัปเดตสถานะ</div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <select
              className="mes-input sm:max-w-xs"
              value={newStatus}
              onChange={(e) => { setNewStatus(e.target.value); setSaved(false); setSaveError(null); }}
            >
              {PIPE_ORDER.map((k) => (
                <option key={k} value={k}>{COMPONENT_STATUS[k].th}</option>
              ))}
            </select>
            <button
              className="mes-btn mes-btn-primary"
              onClick={handleSave}
              disabled={saving || (newStatus === piece.status && !saved)}
            >
              <Icon name="circle-check" size={15} /> {saving ? 'กำลังบันทึก…' : 'อัปเดตสถานะ'}
            </button>
          </div>
          {saved && !saveError && (
            <div className="mt-2 flex items-center gap-2 rounded-sm border border-sem-success px-3 py-2 text-sm text-sem-success">
              <Icon name="circle-check" size={15} />
              บันทึกแล้ว — สถานะใหม่: {COMPONENT_STATUS[newStatus]?.th}
            </div>
          )}
          {saveError && (
            <div className="mt-2 flex items-center gap-2 rounded-sm border border-sem-danger px-3 py-2 text-sm text-sem-danger">
              <Icon name="circle-x" size={15} />
              {saveError}
            </div>
          )}
        </div>
      )}

      {sub === 'history' && (
        <div className="mt-3">
          {histLoading ? (
            <Spinner />
          ) : (
            <Timeline
              items={(history && history.length > 0
                ? history
                : [{ status: piece.status, updated_at: null, updated_by: 'ระบบ' }]
              ).map((h, i) => {
                const hm = resolveComponentStatus(h.status);
                return {
                  meta: hm,
                  title: hm.th,
                  sub: h.updated_at
                    ? new Date(h.updated_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
                    : '—',
                  by: h.updated_by || '—',
                  current: i === 0,
                };
              })}
            />
          )}
        </div>
      )}

      {sub === 'files' && (
        <EmptyState icon="file-text" title="ยังไม่มีไฟล์" />
      )}
    </Modal>
  );
}

/* ---- Pieces tab: per-section accordion with status-colored tile grid ---- */
const TILE_LIMIT_INITIAL = 120;
const TILE_LIMIT_STEP = 240;

// matchCount: non-null only while a search query is active — header then shows "พบ N จาก total ชิ้น".
function SectionGroup({ section, pieces, open, onToggle, onPiece, matchCount = null }) {
  const [limit, setLimit] = useState(TILE_LIMIT_INITIAL);
  useEffect(() => { if (open) setLimit(TILE_LIMIT_INITIAL); }, [open, section.id]);

  const activeStatuses = PIPE_ORDER.filter((k) => (section.status[k] || 0) > 0);

  return (
    <div className="rounded-md border border-mes-border">
      <button className="flex w-full min-h-touch items-center gap-2 px-3 py-2 text-left" onClick={onToggle}>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} className="shrink-0 text-mes-muted" />
        <span className="text-sm font-semibold">{section.name}</span>
        <span className="hidden min-w-0 grow sm:block">
          <PipelineBar status={section.status} order={PIPE_ORDER} meta={COMPONENT_STATUS} height={7} />
        </span>
        <span className="ml-auto shrink-0 text-xs text-mes-muted tabular-nums sm:ml-0">
          {matchCount != null
            ? `พบ ${fmt(matchCount)} จาก ${fmt(section.total)} ชิ้น`
            : `${fmt(section.total)} ชิ้น · ${pct(section.status.installed || 0, section.total).toFixed(0)}%`}
        </span>
      </button>
      {open && (
        <div className="border-t border-mes-border">
          {activeStatuses.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 pt-2.5">
              {activeStatuses.map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <StatusBadge status={k} size="sm" />
                  <span className="text-xs font-semibold tabular-nums">{fmt(section.status[k])}</span>
                </span>
              ))}
            </div>
          )}
          {pieces === null || pieces === undefined ? (
            <Spinner label="กำลังโหลดชิ้นงาน…" />
          ) : pieces.length === 0 ? (
            <EmptyState icon="box" title="ไม่พบชิ้นงาน" />
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5 p-3">
                {pieces.slice(0, limit).map((p) => (
                  <StatusBadge
                    key={p.id}
                    variant="tile"
                    status={p.status}
                    onClick={() => onPiece({ ...p, section_name: section.name })}
                    aria-label={`${p.name || p.component_code || p.id} — ${(COMPONENT_STATUS[p.status] || COMPONENT_STATUS.planning).th}`}
                  >
                    {p.name || p.component_code || '—'}
                  </StatusBadge>
                ))}
              </div>
              {pieces.length > limit && (
                <button className="mes-btn mes-btn-ghost mx-3 mb-3 w-[calc(100%-24px)]" onClick={() => setLimit((l) => l + TILE_LIMIT_STEP)}>
                  แสดงเพิ่ม ({fmt(pieces.length - limit)} ชิ้น) <Icon name="chevron-down" size={14} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PiecesTab({ sections, total, onPiece }) {
  const [openSectionId, setOpenSectionId] = useState(sections[0]?.id ?? null);
  const [query, setQuery] = useState('');
  // Cache: sectionId -> undefined (not requested) | null (loading) | array (sorted pieces)
  const [piecesBySection, setPiecesBySection] = useState({});
  const q = query.trim().toLowerCase();

  const ensurePieces = (sectionId) => {
    if (!sectionId) return;
    setPiecesBySection((prev) => {
      if (prev[sectionId] !== undefined) return prev;
      fetchComponentsBySectionId(sectionId)
        .then((res) => {
          const rows = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          rows.sort((a, b) => numericCompare(a.name || a.component_code, b.name || b.component_code));
          setPiecesBySection((p2) => ({ ...p2, [sectionId]: rows }));
        })
        .catch(() => setPiecesBySection((p2) => ({ ...p2, [sectionId]: [] })));
      return { ...prev, [sectionId]: null };
    });
  };

  useEffect(() => { ensurePieces(openSectionId); }, [openSectionId]);

  // Searching needs every section's pieces — fetch all not-yet-requested sections once.
  useEffect(() => {
    if (q) sections.forEach((s) => ensurePieces(s.id));
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const pieceLabel = (p) => String(p.name || p.component_code || '').toLowerCase();
  const visible = sections.map((s) => {
    const pieces = piecesBySection[s.id];
    if (!q) return { section: s, pieces, open: openSectionId === s.id };
    if (pieces === undefined || pieces === null) return { section: s, pieces: null, open: true };
    const matches = pieces.filter((p) => pieceLabel(p).includes(q));
    return matches.length === 0 ? null : { section: s, pieces: matches, open: true };
  }).filter(Boolean);

  return (
    <div className="p-4 md:p-5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative grow sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mes-muted">
            <Icon name="search" size={15} />
          </span>
          <input
            className="mes-input !pl-9"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาเลขชิ้นงาน…"
            aria-label="ค้นหาเลขชิ้นงาน"
          />
        </div>
        <div className="text-xs text-mes-muted tabular-nums sm:ml-auto">
          {q
            ? `พบ ${fmt(visible.reduce((n, v) => n + (v.pieces?.length || 0), 0))} ชิ้น ใน ${fmt(visible.length)} ชั้น`
            : `${fmt(sections.length)} ชั้น · ${fmt(total)} ชิ้นงาน`}
        </div>
      </div>
      {q && visible.length === 0 ? (
        <EmptyState icon="search" title={`ไม่พบชิ้นงานที่ตรงกับ "${query.trim()}"`} />
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(({ section, pieces, open }) => (
            <SectionGroup
              key={section.id}
              section={section}
              pieces={pieces}
              open={open}
              onToggle={() => { if (!q) setOpenSectionId(openSectionId === section.id ? null : section.id); }}
              onPiece={onPiece}
              matchCount={q ? (pieces?.length ?? null) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Main drawer ---- */
export function ProjectDrawer({ project, onClose, onDataLoaded, onStatusUpdated }) {
  const [tab, setTab] = useState('overview');
  const [fullProject, setFullProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState([]);
  const [piece, setPiece] = useState(null);
  const [expanded, setExpanded] = useState(() => {
    try { return sessionStorage.getItem('mes.drawer.expanded') === '1'; } catch { return false; }
  });
  const toggleExpanded = () => setExpanded((e) => {
    try { sessionStorage.setItem('mes.drawer.expanded', e ? '' : '1'); } catch { /* private mode */ }
    return !e;
  });
  const navigate = useNavigate();

  useEffect(() => {
    setTab('overview');
    setFullProject(null);
    setPos([]);
    setPiece(null);
    if (!project) return;

    const load = async () => {
      setLoading(true);
      try {
        const [secRes, compRes, poRes] = await Promise.all([
          fetchSectionsByProjectId(project.id),
          fetchComponentsByProjectId(project.id),
          fetchPOsByProject(project.id),
        ]);
        setPos(poRes.data || []);

        const sections = Array.isArray(secRes.data) ? secRes.data : (Array.isArray(secRes) ? secRes : []);
        // Backend returns a plain array; older shape was { precast, other } — accept both.
        const allComps = Array.isArray(compRes)
          ? compRes
          : [...(compRes?.precast || []), ...(compRes?.other || [])];

        const secMap = {};
        sections.forEach((s, i) => {
          secMap[s.id] = {
            id: s.id,
            name: s.name || `ชั้น ${i + 1}`,
            total: 0,
            status: emptyStatus(),
          };
        });
        const VALID = Object.keys(COMPONENT_STATUS);
        allComps.forEach((c) => {
          const sid = c.section_id;
          if (secMap[sid]) {
            secMap[sid].total++;
            const st = c.status || 'planning';
            if (VALID.includes(st)) secMap[sid].status[st]++;
          }
        });
        const enrichedSections = Object.values(secMap).sort((a, b) => numericCompare(a.name, b.name));

        const aggStatus = emptyStatus();
        let total = 0;
        enrichedSections.forEach((s) => {
          PIPE_ORDER.forEach((k) => { aggStatus[k] += s.status[k] || 0; });
          total += s.total;
        });
        if (total === 0) total = project.total;

        const enriched = { ...project, sections: enrichedSections, status: aggStatus, total };
        setFullProject(enriched);
        if (onDataLoaded) onDataLoaded(enriched);
      } catch {
        setFullProject(project);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  if (!project) return null;
  const p = fullProject || project;
  const prog = pct(p.status.installed || 0, p.total);

  const TABS = [
    { id: 'overview', label: 'ภาพรวม', icon: 'aperture' },
    { id: 'pieces', label: 'ชิ้นงาน', icon: 'box', n: p.total },
    { id: 'po', label: 'ใบสั่งซื้อ', icon: 'file-invoice', n: pos.length },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className={`relative flex h-full w-full flex-col bg-mes-surface md:border-l md:border-mes-border shadow-overlay transition-[max-width] duration-300 ${
          expanded ? 'md:max-w-[min(1400px,95vw)]' : 'md:max-w-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="border-b border-mes-border bg-mes-surface-2 px-4 py-4 md:px-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 grow">
              <div className="font-mono text-xs text-mes-muted">{p.code}</div>
              <div className="truncate text-lg font-bold">{p.name}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-mes-muted">
                <Icon name="user" size={13} /> {p.mgr}
              </div>
            </div>
            <button
              className="mes-btn mes-btn-ghost !min-h-touch !px-3 shrink-0 hidden md:inline-flex"
              onClick={toggleExpanded}
              aria-label={expanded ? 'ย่อหน้าต่าง' : 'ขยายหน้าต่าง'}
            >
              <Icon name={expanded ? 'minimize' : 'maximize'} size={18} />
            </button>
            <button className="mes-btn mes-btn-ghost !min-h-touch !px-3 shrink-0" onClick={onClose} aria-label="ปิด">
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              [fmt(p.total), 'ชิ้นงาน'],
              [fmt(p.sections.length || p.sectionCount), 'ชั้น'],
              [`${prog.toFixed(0)}%`, 'ติดตั้งแล้ว'],
              [fmt(p.status.rejected || 0), 'ถูกปฏิเสธ'],
            ].map(([v, l], i) => (
              <div key={l} className="rounded-sm bg-mes-surface px-1 py-1.5">
                <div className={`text-base font-bold tabular-nums ${i === 3 && p.status.rejected > 0 ? 'text-status-rejected' : ''}`}>{v}</div>
                <div className="text-[11px] text-mes-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-mes-border px-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex min-h-touch items-center gap-1.5 border-b-2 px-3 text-sm font-semibold -mb-px ${
                tab === t.id ? 'border-mes-accent text-mes-accent' : 'border-transparent text-mes-muted'
              }`}
            >
              <Icon name={t.icon} size={16} /> {t.label}
              {t.n != null && <em className="not-italic rounded-full bg-mes-surface-2 px-1.5 text-xs tabular-nums">{fmt(t.n)}</em>}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="relative min-h-0 grow overflow-y-auto">
          {loading && <Spinner label="กำลังโหลดข้อมูล…" />}

          {!loading && tab === 'overview' && (
            <div className="p-4 md:p-5">
              <div className="rounded-md border border-mes-border p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-mes-muted">สถานะการผลิตทั้งโครงการ</span>
                  <span className="ml-auto">
                    <Donut
                      segments={PIPE_ORDER.map((k) => ({ value: p.status[k] || 0, cssVar: COMPONENT_STATUS[k].cssVar }))}
                      size={52} thickness={8}
                    >
                      <span className="text-[10px] font-bold tabular-nums">{fmt(p.total)}</span>
                    </Donut>
                  </span>
                </div>
                <div className="mt-2">
                  <PipelineBar status={p.status} order={PIPE_ORDER} meta={COMPONENT_STATUS} height={12} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {PIPE_ORDER.map((k) => {
                    const m = COMPONENT_STATUS[k];
                    return (
                      <div key={k} className="flex items-center gap-2 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ background: `var(${m.cssVar})` }} />
                        <span className="text-mes-muted">{m.th}</span>
                        <span className="ml-auto font-semibold tabular-nums">{fmt(p.status[k] || 0)}</span>
                        <span className="w-12 text-right tabular-nums text-mes-muted">{pct(p.status[k] || 0, p.total).toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 text-xs font-semibold text-mes-muted">รายการชั้น ({p.sections.length})</div>
              <div className="mt-2 flex flex-col gap-1.5">
                {p.sections.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-sm border border-mes-border px-3 py-2">
                    <span className="w-24 shrink-0 truncate text-sm font-medium">{s.name}</span>
                    <span className="min-w-0 grow">
                      <PipelineBar status={s.status} order={PIPE_ORDER} meta={COMPONENT_STATUS} height={8} />
                    </span>
                    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-mes-muted">{fmt(s.total)} ชิ้น</span>
                    <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">
                      {pct(s.status.installed || 0, s.total).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && tab === 'pieces' && (
            <PiecesTab key={p.id} sections={p.sections} total={p.total} onPiece={setPiece} />
          )}

          {!loading && tab === 'po' && (
            <div className="p-4 md:p-5">
              <div className="mb-2 flex items-center">
                <span className="text-xs text-mes-muted tabular-nums">{pos.length} รายการ</span>
                <button
                  className="mes-btn mes-btn-primary ml-auto !min-h-touch md:!min-h-0 md:!py-1.5 text-xs"
                  onClick={() => navigate(`/forms/form-po?project=${p.id}`)}
                >
                  <Icon name="plus" size={14} /> สร้างใบสั่งซื้อ
                </button>
              </div>
              {pos.length === 0 ? (
                <EmptyState icon="file-invoice" title="ยังไม่มีใบสั่งซื้อ" />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {pos.map((po) => (
                    <button
                      key={po.id}
                      className="flex min-h-touch items-center gap-3 rounded-sm border border-mes-border px-3 py-2 text-left hover:bg-mes-surface-2"
                      onClick={() => navigate(`/forms/form-po?highlight=${po.id}`)}
                    >
                      <span className="text-mes-muted"><Icon name="file-invoice" size={17} /></span>
                      <span className="min-w-0 grow">
                        <span className="block truncate text-sm font-semibold">{po.po_number}</span>
                        <span className="block text-xs text-mes-muted tabular-nums">{po.item_count} รายการ</span>
                      </span>
                      <StatusBadge status={po.status} kind="po" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {piece && (
            <PieceDetail
              piece={piece}
              project={p}
              onClose={() => setPiece(null)}
              onStatusUpdated={() => onStatusUpdated?.(project.id)}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
