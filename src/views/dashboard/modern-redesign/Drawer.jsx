import React, { useState, useEffect, useMemo } from 'react';
import { Icon, Donut, PipelineBar, QRCode } from './Primitives';
import { STATUS, PIPE_ORDER, fmt, pct } from './utils';
import { fetchSectionsByProjectId, fetchComponentsByProjectId, updateComponentStatus, fetchComponentsBySectionId, fetchComponentById, fetchPOsByProject } from 'src/utils/api';
import { useNavigate } from 'react-router-dom';

function Chip({ label, color }) {
  return (
    <span className="dchip" style={{ color, background: color + '1f' }}>{label}</span>
  );
}

function RecordList({ rows, icon, empty, newLabel }) {
  return (
    <div>
      <div className="rec-bar">
        <span>{rows.length} รายการ</span>
        <button className="rec-new"><Icon name="plus" size={14} /> {newLabel}</button>
      </div>
      {rows.length ? (
        <div className="rec-list">
          {rows.map((r) => (
            <div key={r.id} className="rec-row">
              <span className="rec-ic"><Icon name={icon} size={17} /></span>
              <div className="rec-main">
                <div className="rec-label">{r.label}</div>
                <div className="rec-id">{r.id} · <Icon name="calendar" size={11} /> {r.date}</div>
              </div>
              <Chip label={r.status} color={r.color} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rec-empty"><Icon name="circle-check" size={22} /> {empty}</div>
      )}
    </div>
  );
}

// Build mock records for PR/PO/Issues (placeholder until real feature is built)
function makeRecords(project) {
  const seed = project.id.charCodeAt ? project.id.charCodeAt(0) : 42;
  const nPR = Math.min(4, 1 + Math.floor(project.total / 60));
  const nIss = project.status.rejected > 0 ? Math.min(3, 1 + Math.floor(project.status.rejected / 2)) : 0;

  const pr = Array.from({ length: nPR }, (_, i) => ({
    id: `PR-${1000 + seed + i}`,
    label: `คำสั่งผลิต ${['ผนัง', 'เสา', 'คาน', 'พื้น'][i % 4]} ชุดที่ ${i + 1}`,
    status: ['อนุมัติแล้ว', 'รออนุมัติ', 'กำลังผลิต'][i % 3],
    color: ['#2E9E5B', '#E08A00', '#5D87FF'][i % 3],
    date: `${1 + i}/05/68`,
  }));

  const iss = Array.from({ length: nIss }, (_, i) => ({
    id: `IS-${2000 + seed + i}`,
    label: ['ผิวคอนกรีตไม่เรียบ', 'ขนาดคลาดเคลื่อน', 'รอยร้าวขอบชิ้น'][i % 3],
    status: ['เปิด', 'กำลังแก้ไข'][i % 2],
    color: ['#DC4B4B', '#E08A00'][i % 2],
    date: `${5 + i}/05/68`,
  }));

  return { pr, po: [], iss };
}

/* ---- Per-piece detail overlay ---- */
function PieceDetail({ piece, project, onClose, onStatusUpdated }) {
  const [sub, setSub] = useState('detail');
  const [newStatus, setNewStatus] = useState(piece.status);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState(null);
  const [histLoading, setHistLoading] = useState(false);
  const m = STATUS[piece.status] || STATUS.planning;

  useEffect(() => {
    if (sub !== 'history' || history !== null) return;
    setHistLoading(true);
    fetchComponentById(piece.id)
      .then((res) => setHistory(Array.isArray(res.history) ? res.history : []))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [sub]);

  const SUBS = [
    { id: 'detail', label: 'รายละเอียดชิ้นงาน', icon: 'cube' },
    { id: 'history', label: 'ประวัติสถานะ', icon: 'clock' },
    { id: 'files', label: 'ไฟล์', icon: 'file-text' },
  ];

  const prop = (icon, label, value) => (
    <div className="pd-prop">
      <span className="pd-prop-ic"><Icon name={icon} size={15} /></span>
      <span className="pd-prop-l">{label}</span>
      <span className="pd-prop-v">{value || '—'}</span>
    </div>
  );

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

  const uuid = piece.id || 'SFC-' + piece.code;

  return (
    <div className="pd-overlay">
      <div className="pd-head">
        <button className="pd-back" onClick={onClose}>
          <Icon name="arrow-left" size={17} /> กลับ
        </button>
        <div className="pd-head-main">
          <div className="pd-code">{piece.name || piece.code || piece.component_code || '—'}</div>
          <div className="pd-type">{piece.type || 'ชิ้นงานพรีคาสท์'}</div>
        </div>
        <Chip label={m.th} color={m.color} />
      </div>

      <div className="pd-body">
        <div className="pd-qr-card">
          <div className="pd-qr"><QRCode value={uuid} size={120} /></div>
          <div className="pd-qr-meta">
            <div className="pd-qr-row">
              <span>รหัสชิ้นงาน</span>
              <b>{piece.name || piece.code || '—'}</b>
            </div>
            <div className="pd-qr-row">
              <span>ID</span>
              <b className="mono">{String(piece.id || '').slice(0, 18) || '—'}</b>
            </div>
            <div className="pd-qr-row">
              <span>โครงการ</span>
              <b>{project.code}</b>
            </div>
            <div className="pd-qr-actions">
              <button className="pd-mini"><Icon name="download" size={14} /> ดาวน์โหลด QR</button>
              <button className="pd-mini"><Icon name="scan" size={14} /> สแกนอัปเดต</button>
            </div>
          </div>
        </div>

        <div className="pd-subtabs">
          {SUBS.map((s) => (
            <button
              key={s.id}
              className={'pd-subtab' + (sub === s.id ? ' is-active' : '')}
              onClick={() => setSub(s.id)}
            >
              <Icon name={s.icon} size={15} /> {s.label}
            </button>
          ))}
        </div>

        {sub === 'detail' && (
          <div className="pd-pad">
            <div className="pd-section-t">คุณสมบัติ</div>
            <div className="pd-props">
              {prop('cube', 'ประเภทชิ้นงาน', piece.type)}
              {prop('ruler', 'ขนาด ก×ย×หนา (มม.)', piece.width && piece.height
                ? `${piece.width} × ${piece.height} × ${piece.thickness || '—'}`
                : '—')}
              {prop('photo', 'พื้นที่', piece.area ? `${piece.area} m²` : '—')}
              {prop('box', 'ปริมาตร', piece.volume ? `${piece.volume} m³` : '—')}
              {prop('weight', 'น้ำหนัก', piece.weight ? `${piece.weight} ตัน` : '—')}
              {prop('hash', 'ชั้น / Section', piece.section_name || '—')}
            </div>

            <div className="pd-section-t mt">อัปเดตสถานะ</div>
            <div className="pd-update">
              <select
                className="pd-select"
                value={newStatus}
                onChange={(e) => { setNewStatus(e.target.value); setSaved(false); setSaveError(null); }}
              >
                {PIPE_ORDER.map((k) => (
                  <option key={k} value={k}>{STATUS[k].th}</option>
                ))}
              </select>
              <button
                className="pd-save"
                onClick={handleSave}
                disabled={saving || (newStatus === piece.status && !saved)}
              >
                <Icon name="circle-check" size={15} /> {saving ? 'กำลังบันทึก…' : 'อัปเดตสถานะ'}
              </button>
            </div>
            {saved && !saveError && (
              <div className="pd-saved">
                <Icon name="circle-check" size={15} />
                บันทึกแล้ว — สถานะใหม่: {STATUS[newStatus]?.th}
              </div>
            )}
            {saveError && (
              <div className="pd-saved" style={{ background: '#FBE7E7', color: '#DC4B4B' }}>
                <Icon name="circle-x" size={15} />
                {saveError}
              </div>
            )}
          </div>
        )}

        {sub === 'history' && (
          <div className="pd-pad">
            <div className="pd-section-t">ประวัติสถานะ</div>
            {histLoading && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
                กำลังโหลด…
              </div>
            )}
            {!histLoading && (
              <div className="pd-timeline">
                {(history && history.length > 0 ? history : [{ status: piece.status, updated_at: null, updated_by: 'ระบบ' }]).map((h, i) => {
                  const hm = STATUS[h.status] || STATUS.planning;
                  const dateStr = h.updated_at
                    ? new Date(h.updated_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
                    : '—';
                  return (
                    <div key={i} className={'pd-tl' + (i === 0 ? ' is-cur' : '')}>
                      <span className="pd-tl-dot" style={{ background: hm.color }} />
                      <div className="pd-tl-main">
                        <div className="pd-tl-top">
                          <b>{hm.th}</b>
                          <span>{dateStr}</span>
                        </div>
                        <div className="pd-tl-by"><Icon name="user" size={12} /> {h.updated_by || '—'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {sub === 'files' && (
          <div className="pd-pad">
            <div className="rec-bar">
              <span>ไฟล์เอกสาร</span>
              <button className="rec-new"><Icon name="plus" size={14} /> อัปโหลดไฟล์</button>
            </div>
            <div className="rec-empty" style={{ color: 'var(--ink3)' }}>
              <Icon name="file-text" size={22} style={{ color: 'var(--ink3)' }} />
              <span style={{ marginLeft: 8 }}>ยังไม่มีไฟล์</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Collapsible section with piece table ---- */
function SectionGroup({ project, section, open, onToggle, onPiece }) {
  const [limit, setLimit] = useState(40);
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const res = await fetchComponentsBySectionId(section.id);
        setPieces(Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
      } catch {
        setPieces([]);
      }
    };
    load();
    setLimit(40);
  }, [open, section.id]);

  const m = STATUS[section.status] || STATUS.planning;

  return (
    <div className={'psec' + (open ? ' is-open' : '')}>
      <button className="psec-head" onClick={onToggle}>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} style={{ color: 'var(--ink3)' }} />
        <span className="psec-name">{section.name}</span>
        <span className="psec-type">{section.sampleType}</span>
        <span className="psec-bar">
          <PipelineBar status={section.status} order={PIPE_ORDER} meta={STATUS} height={7} />
        </span>
        <span className="psec-count">{fmt(section.total)} ชิ้น</span>
      </button>
      {open && (
        <div className="psec-body">
          <table className="ptbl">
            <thead>
              <tr>
                <th>รหัสชิ้นงาน</th>
                <th>ประเภท</th>
                <th>ขนาด ก×ย×น (มม.)</th>
                <th className="c-num">น้ำหนัก</th>
                <th>สถานะ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pieces.slice(0, limit).map((p) => {
                const pm = STATUS[p.status] || STATUS.planning;
                return (
                  <tr key={p.id} className="ptr" onClick={() => onPiece({ ...p, section_name: section.name })}>
                    <td className="ptr-code">
                      <span className="ptr-dot" style={{ background: pm.color }} />
                      {p.name || p.component_code || p.id}
                    </td>
                    <td className="ptr-type">{p.type || '—'}</td>
                    <td className="ptr-dim">
                      {p.width && p.height ? `${p.width}×${p.height}×${p.thickness || '—'}` : '—'}
                    </td>
                    <td className="ptr-wt">{p.weight || '—'}</td>
                    <td className="ptr-st"><Chip label={pm.th} color={pm.color} /></td>
                    <td className="ptr-go"><Icon name="chevron-right" size={16} /></td>
                  </tr>
                );
              })}
              {pieces.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
                    กำลังโหลดชิ้นงาน…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pieces.length > limit && (
            <button className="ptile-more" onClick={() => setLimit((l) => l + 80)}>
              แสดงเพิ่ม ({fmt(pieces.length - limit)} ชิ้น) <Icon name="chevron-down" size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Pieces tab: sections accordion ---- */
function PiecesTab({ project, onStatusUpdated }) {
  const [openId, setOpenId] = useState(project.sections[0]?.id || null);
  const [piece, setPiece] = useState(null);

  return (
    <>
      <div className="dr-pad">
        <div className="rec-bar">
          <span>{fmt(project.sections.length)} ชั้น · {fmt(project.total)} ชิ้นงาน</span>
          <button className="rec-new"><Icon name="scan" size={14} /> สแกน QR</button>
        </div>
        <div className="pieces-secs">
          {project.sections.map((s) => (
            <SectionGroup
              key={s.id}
              project={project}
              section={s}
              open={openId === s.id}
              onToggle={() => setOpenId(openId === s.id ? null : s.id)}
              onPiece={setPiece}
            />
          ))}
        </div>
      </div>
      {piece && (
        <PieceDetail
          piece={piece}
          project={project}
          onClose={() => setPiece(null)}
          onStatusUpdated={onStatusUpdated}
        />
      )}
    </>
  );
}

/* ---- Main drawer ---- */
export function ProjectDrawer({ project, onClose, onDataLoaded, onStatusUpdated }) {
  const [tab, setTab] = useState('overview');
  const [fullProject, setFullProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [pos, setPos] = useState([]);

  useEffect(() => {
    setTab('overview');
    setFullProject(null);
    setPos([]);
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
        const allComps = [
          ...(compRes.precast || []),
          ...(compRes.other || []),
        ];

        // Build enriched sections with status counts
        const secMap = {};
        sections.forEach((s, i) => {
          secMap[s.id] = {
            id: s.id,
            name: s.name || `ชั้น ${i + 1}`,
            total: 0,
            status: { planning: 0, manufactured: 0, transported: 0, accepted: 0, installed: 0, rejected: 0 },
            sampleType: 'ชิ้นงานพรีคาสท์',
          };
        });

        const VALID_STATUSES = Object.keys(STATUS);
        allComps.forEach((c) => {
          const sid = c.section_id;
          if (secMap[sid]) {
            secMap[sid].total++;
            const st = c.status || 'planning';
            if (VALID_STATUSES.includes(st)) secMap[sid].status[st]++;
          }
        });

        const enrichedSections = Object.values(secMap);

        // Aggregate status
        const aggStatus = { planning: 0, manufactured: 0, transported: 0, accepted: 0, installed: 0, rejected: 0 };
        let total = 0;
        enrichedSections.forEach((s) => {
          PIPE_ORDER.forEach((k) => { aggStatus[k] += s.status[k] || 0; });
          total += s.total;
        });
        if (total === 0) total = project.total;

        const enriched = {
          ...project,
          sections: enrichedSections,
          status: aggStatus,
          total,
        };

        setFullProject(enriched);
        if (onDataLoaded) onDataLoaded(enriched);
      } catch (err) {
        setFullProject(project);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [project?.id]);

  // Hooks must run unconditionally — keep this useMemo above the early return.
  const p = fullProject || project;
  const records = useMemo(() => (p ? makeRecords(p) : { pr: [], po: [], iss: [] }), [p?.id]);

  if (!project) return null;

  const inst = p.status.installed || 0;
  const prog = pct(inst, p.total);

  const TABS = [
    { id: 'overview', label: 'ภาพรวม', icon: 'aperture' },
    { id: 'pieces', label: 'ชิ้นงาน', icon: 'box', n: p.total },
    { id: 'pr', label: 'คำขอผลิต', icon: 'clipboard-list', n: records.pr.length },
    { id: 'po', label: 'ใบสั่งซื้อ', icon: 'file-invoice', n: pos.length },
    { id: 'issues', label: 'ปัญหา', icon: 'alert-triangle', n: records.iss.length, danger: records.iss.length > 0 },
  ];

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <div className="mes-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dr-head">
          <div className="dr-head-sky" />
          <div className="dr-head-inner">
            <button className="dr-close" onClick={onClose}><Icon name="x" size={18} /></button>
            <div className="dr-code">{p.code}</div>
            <div className="dr-name">{p.name}</div>
            <div className="dr-sub">
              <Icon name="map-pin" size={13} /> {p.site}&nbsp;·&nbsp;
              <Icon name="user" size={13} /> {p.mgr}
            </div>
            <div className="dr-stats">
              <div><b>{fmt(p.total)}</b><span>ชิ้นงาน</span></div>
              <div><b>{fmt(p.sections.length)}</b><span>ชั้น</span></div>
              <div><b>{prog.toFixed(0)}%</b><span>ติดตั้งแล้ว</span></div>
              <div>
                <b style={{ color: '#FFD3CB' }}>{fmt(p.status.rejected || 0)}</b>
                <span>ถูกปฏิเสธ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dr-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'dr-tab' + (tab === t.id ? ' is-active' : '')}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={16} /> {t.label}
              {t.n != null && (
                <em className={t.danger ? 'danger' : ''}>{fmt(t.n)}</em>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="dr-body">
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
              กำลังโหลดข้อมูล…
            </div>
          )}

          {!loading && tab === 'overview' && (
            <div className="dr-pad">
              <div className="dr-pipe-card">
                <div className="dr-pipe-top">
                  <span className="dr-section-t">สถานะการผลิตทั้งโครงการ</span>
                  <Donut
                    segments={PIPE_ORDER.map((k) => ({
                      value: p.status[k] || 0,
                      color: STATUS[k].color,
                    }))}
                    size={56} thickness={9}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{fmt(p.total)}</div>
                  </Donut>
                </div>
                <PipelineBar status={p.status} order={PIPE_ORDER} meta={STATUS} height={12} />
                <div className="dr-pipe-legend">
                  {PIPE_ORDER.map((k) => (
                    <div key={k} className="dr-leg">
                      <span className="dr-leg-dot" style={{ background: STATUS[k].color }} />
                      <span className="dr-leg-l">{STATUS[k].th}</span>
                      <span className="dr-leg-v">{fmt(p.status[k] || 0)}</span>
                      <span className="dr-leg-p">{pct(p.status[k] || 0, p.total).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dr-section-t mt">รายการชั้น ({p.sections.length})</div>
              <div className="dr-sec-list">
                {p.sections.map((s) => (
                  <div key={s.id} className="dr-sec">
                    <span className="dr-sec-name">{s.name}</span>
                    <span className="dr-sec-type">{s.sampleType}</span>
                    <span className="dr-sec-bar">
                      <PipelineBar status={s.status} order={PIPE_ORDER} meta={STATUS} height={8} />
                    </span>
                    <span className="dr-sec-count">{fmt(s.total)} ชิ้น</span>
                    <span className="dr-sec-prog">
                      {pct(s.status.installed || 0, s.total).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && tab === 'pieces' && (
            <PiecesTab key={p.id} project={p} onStatusUpdated={() => onStatusUpdated?.(project.id)} />
          )}

          {!loading && tab === 'pr' && (
            <div className="dr-pad">
              <RecordList
                rows={records.pr}
                icon="clipboard-list"
                empty="ไม่มีคำขอผลิตค้างอยู่"
                newLabel="สร้างคำขอผลิต"
              />
            </div>
          )}

          {!loading && tab === 'po' && (
            <div className="dr-pad">
              <div className="rec-bar">
                <span>{pos.length} รายการ</span>
                <button className="rec-new" onClick={() => navigate(`/forms/form-po?project=${p.id}`)}>
                  <Icon name="plus" size={14} /> สร้างใบสั่งซื้อ
                </button>
              </div>
              {pos.length ? (
                <div className="rec-list">
                  {pos.map((po) => {
                    const meta = {
                      draft: { label: 'ฉบับร่าง', color: '#566175' },
                      submitted: { label: 'รอสั่งซื้อ', color: '#E08A00' },
                      ordered: { label: 'สั่งซื้อแล้ว', color: '#5D87FF' },
                      received: { label: 'รับของแล้ว', color: '#2E9E5B' },
                    }[po.status] || { label: po.status, color: '#888' };
                    return (
                      <div
                        key={po.id}
                        className="rec-row"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/forms/form-po?highlight=${po.id}`)}
                      >
                        <span className="rec-ic"><Icon name="file-invoice" size={17} /></span>
                        <div className="rec-main">
                          <div className="rec-label">{po.po_number}</div>
                          <div className="rec-id">{po.item_count} รายการ</div>
                        </div>
                        <Chip label={meta.label} color={meta.color} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rec-empty"><Icon name="circle-check" size={22} /> ยังไม่มีใบสั่งซื้อ</div>
              )}
            </div>
          )}

          {!loading && tab === 'issues' && (
            <div className="dr-pad">
              <RecordList
                rows={records.iss}
                icon="alert-triangle"
                empty="ไม่มีปัญหาที่เปิดอยู่ — ทุกชิ้นผ่าน QC"
                newLabel="แจ้งปัญหา"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
