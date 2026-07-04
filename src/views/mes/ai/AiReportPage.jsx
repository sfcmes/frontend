// [MES] AiReportPage — AI production report (generate, print, export)
import { useState, useEffect } from 'react';
import PageContainer from 'src/components/container/PageContainer';
import { Icon } from 'src/components/mes/Icon';
import { Donut } from 'src/components/mes/charts';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { Spinner, useToast } from 'src/components/mes/ui';
import {
  resolveComponentStatus, resolvePOStatus, fmt,
} from 'src/components/mes/status-meta';
import { fetchProjects, fetchAiReport } from 'src/utils/api';

// Period select ↔ backend `period` param.
const PERIOD_LABEL = { daily: 'วันนี้ (24 ชม.)', weekly: '7 วันล่าสุด' };

// Risk level is NOT a component status — render as text emphasis only
// (sem-danger for high, per F1/F4 precedent), never with status colors.
const RISK_TH = {
  high: { th: 'เสี่ยงสูง', className: 'font-semibold', style: { color: 'var(--sem-danger)' } },
  medium: { th: 'ปานกลาง', className: 'text-mes-text' },
  low: { th: 'ต่ำ', className: 'text-mes-muted' },
};

// Excel sheet names: ≤31 chars, none of [ ] : * ? / \ — non-empty.
// (Duplicated from ChatChart.jsx, which does not export the helper — the small
// mapping is copied locally rather than widening ChatChart's public surface.)
function sanitizeSheetName(title) {
  const cleaned = String(title || '').replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31);
  return cleaned || 'Sheet1';
}

// yyyymmdd-hhmm stamp for the download filename (also duplicated from ChatChart).
function fileStamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function riskText(level) {
  const m = RISK_TH[level] || RISK_TH.low;
  return m.th;
}

// Status donut fed from stats.perStatus — segments [{value, cssVar}] via
// status-meta, mirroring ChatChart's donut/legend approach (Donut skips zeros).
function StatusChart({ perStatus }) {
  const rows = perStatus || [];
  const segments = rows.map((s) => ({
    value: Number(s.count) || 0,
    cssVar: resolveComponentStatus(s.status).cssVar,
  }));
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Donut segments={segments} size={148} thickness={18}>
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums text-mes-text">{fmt(total)}</div>
          <div className="text-[11px] text-mes-muted">ชิ้นงาน</div>
        </div>
      </Donut>
      <ul className="flex min-w-0 flex-col gap-1 text-xs">
        {rows.map((s) => {
          const m = resolveComponentStatus(s.status);
          return (
            <li key={s.status} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `var(${m.cssVar})` }} />
              <span className="text-mes-muted">{m.th}</span>
              <span className="ml-auto pl-4 tabular-nums text-mes-text">{fmt(Number(s.count) || 0)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Movements — status transitions within the period. Compact chips + total.
function Movements({ movements }) {
  const nonZero = (movements?.byStatus || []).filter((m) => (Number(m.count) || 0) > 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold text-mes-text">
        ความเคลื่อนไหวในช่วงเวลา — รวม {fmt(movements?.total ?? 0)} รายการ
      </div>
      {nonZero.length === 0 ? (
        <p className="text-sm text-mes-muted">ไม่มีความเคลื่อนไหวในช่วงนี้</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {nonZero.map((m) => (
            <span
              key={m.status}
              className="inline-flex items-center gap-2 rounded-full border border-mes-border bg-mes-surface-2 px-3 py-1 text-xs"
            >
              <StatusBadge status={m.status} variant="dot" />
              <span className="tabular-nums text-mes-text">{fmt(Number(m.count) || 0)} รายการ</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Delayed components — cards below md, table at md+ (repo table rule).
function DelayedTable({ delayed }) {
  const rows = delayed || [];
  if (rows.length === 0) {
    return <p className="text-sm text-mes-muted">ไม่มีชิ้นงานล่าช้า</p>;
  }
  return (
    <>
      {/* Cards (base → below md) */}
      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((c) => {
          const rm = RISK_TH[c.risk_level] || RISK_TH.low;
          return (
            <div key={c.id} className="rounded-md border border-mes-border bg-mes-surface-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-mes-text">{c.name}</div>
                  <div className="truncate text-xs text-mes-muted">{c.project_name} · {c.section_name}</div>
                </div>
                <span className={`shrink-0 text-xs ${rm.className}`} style={rm.style}>{rm.th}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={c.current_status} size="sm" />
                <span className="text-xs text-mes-muted">ค้าง {fmt(c.hours_in_status)} ชม.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table (md+) */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="mes-th">ชิ้นงาน</th>
              <th className="mes-th">โครงการ</th>
              <th className="mes-th">ชั้น</th>
              <th className="mes-th">สถานะ</th>
              <th className="mes-th text-right">ค้าง (ชม.)</th>
              <th className="mes-th">ระดับความเสี่ยง</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const rm = RISK_TH[c.risk_level] || RISK_TH.low;
              return (
                <tr key={c.id}>
                  <td className="mes-td text-mes-text">{c.name}</td>
                  <td className="mes-td text-mes-muted">{c.project_name}</td>
                  <td className="mes-td text-mes-muted">{c.section_name}</td>
                  <td className="mes-td"><StatusBadge status={c.current_status} size="sm" /></td>
                  <td className="mes-td text-right tabular-nums">{fmt(c.hours_in_status)}</td>
                  <td className="mes-td">
                    <span className={`text-xs ${rm.className}`} style={rm.style}>{rm.th}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// PO summary — per-status chips (StatusBadge kind="po" = the canonical PO label
// source used by the PO page) + recent list when present in the payload.
function PoSummary({ poSummary }) {
  const byStatus = poSummary?.byStatus || [];
  const recent = poSummary?.recent || [];
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-mes-text">
        ใบสั่งซื้อวัตถุดิบ — รวม {fmt(poSummary?.total ?? 0)} ใบ
      </div>
      <div className="flex flex-wrap gap-2">
        {byStatus.map((p) => (
          <span
            key={p.status}
            className="inline-flex items-center gap-2 rounded-full border border-mes-border bg-mes-surface-2 px-3 py-1 text-xs"
          >
            <StatusBadge status={p.status} kind="po" size="sm" />
            <span className="tabular-nums text-mes-text">{fmt(Number(p.count) || 0)}</span>
          </span>
        ))}
      </div>
      {recent.length > 0 && (
        <ul className="flex flex-col gap-1">
          {recent.map((po) => (
            <li
              key={po.id}
              className="flex flex-wrap items-center gap-2 border-b border-mes-border py-1.5 text-xs last:border-0"
            >
              <span className="font-medium text-mes-text">{po.po_number}</span>
              <span className="min-w-0 truncate text-mes-muted">{po.project_name}</span>
              <StatusBadge status={po.status} kind="po" size="sm" className="ml-auto" />
              <span className="tabular-nums text-mes-muted">{fmt(Number(po.item_count) || 0)} รายการ</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <section className="mes-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-mes-text">
        <Icon name={icon} size={17} /> {title}
      </div>
      {children}
    </section>
  );
}

const AiReportPage = () => {
  const { showToast, toastNode } = useToast();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchProjects()
      .then((res) => setProjects(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProjects([]));
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (projectId) params.projectId = projectId;
      const res = await fetchAiReport(params);
      setReport(res.data);
    } catch {
      showToast('ไม่สามารถสร้างรายงานได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Multi-sheet Excel built from the SAME already-fetched report object (no
  // refetch). xlsx is lazy-imported so it stays code-split out of this chunk.
  const exportExcel = async () => {
    if (!report) return;
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Sheet 1 — สถานะ (perStatus)
      const statusRows = (report.stats?.perStatus || []).map((s) => ({
        สถานะ: resolveComponentStatus(s.status).th,
        จำนวน: Number(s.count) || 0,
      }));
      const wsStatus = XLSX.utils.json_to_sheet(statusRows, { header: ['สถานะ', 'จำนวน'] });
      XLSX.utils.book_append_sheet(wb, wsStatus, sanitizeSheetName('สถานะ'));

      // Sheet 2 — ล่าช้า (delayed, Thai headers)
      const delayedHeader = ['ชิ้นงาน', 'โครงการ', 'ชั้น', 'สถานะ', 'ค้าง (ชม.)', 'ระดับความเสี่ยง'];
      const delayedRows = (report.delayed || []).map((c) => ({
        ชิ้นงาน: c.name,
        โครงการ: c.project_name,
        ชั้น: c.section_name,
        สถานะ: resolveComponentStatus(c.current_status).th,
        'ค้าง (ชม.)': Number(c.hours_in_status) || 0,
        ระดับความเสี่ยง: riskText(c.risk_level),
      }));
      const wsDelayed = XLSX.utils.json_to_sheet(delayedRows, { header: delayedHeader });
      XLSX.utils.book_append_sheet(wb, wsDelayed, sanitizeSheetName('ล่าช้า'));

      // Sheet 3 — ใบสั่งซื้อ (poSummary per-status counts)
      const poRows = (report.poSummary?.byStatus || []).map((p) => ({
        สถานะ: resolvePOStatus(p.status).th,
        จำนวน: Number(p.count) || 0,
      }));
      const wsPo = XLSX.utils.json_to_sheet(poRows, { header: ['สถานะ', 'จำนวน'] });
      XLSX.utils.book_append_sheet(wb, wsPo, sanitizeSheetName('ใบสั่งซื้อ'));

      XLSX.writeFile(wb, `sfcmes-report-${fileStamp()}.xlsx`);
    } catch {
      showToast('ไม่สามารถสร้างไฟล์ Excel ได้', 'error');
    }
  };

  const scopeName = report?.scope?.projectName || 'ทุกโครงการ';

  return (
    <PageContainer title="รายงานการผลิต" description="รายงานการผลิตชิ้นส่วนคอนกรีตสำเร็จรูปพร้อมบทวิเคราะห์ AI">
      <div className="flex flex-col gap-4">
        {/* Controls — hidden when printing */}
        <div className="mes-card p-4 print:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grow">
              <label className="mes-label" htmlFor="report-project">โครงการ</label>
              <select
                id="report-project"
                className="mes-input"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">ทุกโครงการ</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:w-48">
              <label className="mes-label" htmlFor="report-period">ช่วงเวลา</label>
              <select
                id="report-period"
                className="mes-input"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="daily">วันนี้</option>
                <option value="weekly">7 วันล่าสุด</option>
              </select>
            </div>
            <button
              type="button"
              className="mes-btn mes-btn-primary sm:w-44"
              onClick={generate}
              disabled={loading}
            >
              {loading ? <Spinner label="กำลังสร้างรายงาน…" /> : (<><Icon name="report" size={17} /> สร้างรายงาน</>)}
            </button>
          </div>
        </div>

        {report && (
          <div className="flex flex-col gap-4">
            {/* Header + actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-lg font-semibold text-mes-text">รายงานการผลิต — {scopeName}</h1>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mes-muted">
                  <span>ช่วงเวลา: {PERIOD_LABEL[report.period] || report.period}</span>
                  <span>สร้างเมื่อ: {new Date(report.generatedAt).toLocaleString('th-TH')}</span>
                </div>
              </div>
              <div className="flex gap-2 print:hidden">
                <button type="button" className="mes-btn mes-btn-ghost" onClick={() => window.print()}>
                  <Icon name="printer" size={16} /> พิมพ์
                </button>
                <button type="button" className="mes-btn mes-btn-ghost" onClick={exportExcel}>
                  <Icon name="download" size={16} /> ดาวน์โหลด Excel
                </button>
              </div>
            </div>

            <SectionCard icon="aperture" title="จำนวนชิ้นงานตามสถานะล่าสุด">
              <StatusChart perStatus={report.stats?.perStatus} />
            </SectionCard>

            <SectionCard icon="refresh" title="ความเคลื่อนไหว">
              <Movements movements={report.movements} />
            </SectionCard>

            <SectionCard icon="alert-triangle" title="ชิ้นงานล่าช้า">
              <DelayedTable delayed={report.delayed} />
            </SectionCard>

            <SectionCard icon="file-invoice" title="ใบสั่งซื้อวัตถุดิบ">
              <PoSummary poSummary={report.poSummary} />
            </SectionCard>

            <SectionCard icon="message-chatbot" title="บทวิเคราะห์ AI">
              {report.narrative ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-mes-text">{report.narrative}</p>
              ) : (
                <p className="text-sm text-mes-muted">
                  บทวิเคราะห์ AI ไม่พร้อมใช้งานชั่วคราว — ข้อมูลตัวเลขด้านบนครบถ้วน
                </p>
              )}
            </SectionCard>
          </div>
        )}
      </div>
      {toastNode}
    </PageContainer>
  );
};

export default AiReportPage;
