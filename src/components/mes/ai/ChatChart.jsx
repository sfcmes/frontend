// [MES] ChatChart — renders grounded chart payloads + Excel download chips in chat bubbles
import { Icon } from 'src/components/mes/Icon';
import { Donut, PipelineBar } from 'src/components/mes/charts';
import {
  COMPONENT_STATUS, PIPE_ORDER, resolveComponentStatus, emptyStatus,
} from 'src/components/mes/status-meta';
import { useToast } from 'src/components/mes/ui';

// Backend chart payloads are grounded (produced by SQL, never the model):
//   donut    → data: [{ status, count }]  (all six canonical keys, workflow order, zero-filled)
//   pipeline → data: [{ section, counts: [{ status, count }] }]  (one entry per section)
// Status → colour/label comes ONLY from status-meta (charts are a legal place for
// status colours per the design rules). Datasets become Excel via a lazily-imported
// xlsx build so the chat bundle stays small.

// Excel sheet names: ≤31 chars, none of [ ] : * ? / \ — and non-empty.
function sanitizeSheetName(title) {
  const cleaned = String(title || '').replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31);
  return cleaned || 'Sheet1';
}

// yyyymmdd-hhmm stamp for the download filename.
function fileStamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function DonutChart({ chart }) {
  const data = chart.data || [];
  const segments = data.map((d) => ({
    value: Number(d.count) || 0,
    cssVar: resolveComponentStatus(d.status).cssVar,
  }));
  return (
    <div className="rounded-lg border border-mes-border bg-mes-surface p-3">
      {chart.title && <div className="mb-2 text-xs font-semibold text-mes-muted">{chart.title}</div>}
      <div className="flex flex-wrap items-center gap-4">
        <Donut segments={segments} size={132} thickness={16} />
        <ul className="flex min-w-0 flex-col gap-1 text-xs">
          {data.map((d) => {
            const m = resolveComponentStatus(d.status);
            return (
              <li key={d.status} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `var(${m.cssVar})` }} />
                <span className="text-mes-muted">{m.th}</span>
                <span className="ml-auto pl-2 tabular-nums text-mes-text">{Number(d.count) || 0}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function PipelineChart({ chart }) {
  const data = chart.data || [];
  return (
    <div className="rounded-lg border border-mes-border bg-mes-surface p-3">
      {chart.title && <div className="mb-2 text-xs font-semibold text-mes-muted">{chart.title}</div>}
      <div className={`flex flex-col gap-2 ${data.length > 8 ? 'max-h-64 overflow-y-auto pr-1' : ''}`}>
        {data.map((row, i) => {
          const status = emptyStatus();
          (row.counts || []).forEach((c) => {
            if (c && c.status in status) status[c.status] = Number(c.count) || 0;
          });
          return (
            <div key={`${row.section}-${i}`} className="flex flex-col gap-1">
              <span className="truncate text-xs text-mes-muted">{row.section}</span>
              <PipelineBar status={status} order={PIPE_ORDER} meta={COMPONENT_STATUS} height={10} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DatasetChip({ dataset, onError }) {
  const download = async () => {
    try {
      const XLSX = await import('xlsx');
      const columns = dataset.columns || [];
      const header = columns.map((c) => c.label);
      const rows = (dataset.rows || []).map((r) => {
        const shaped = {};
        columns.forEach((c) => { shaped[c.label] = r[c.key] ?? null; });
        return shaped;
      });
      const ws = XLSX.utils.json_to_sheet(rows, { header });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(dataset.title));
      XLSX.writeFile(wb, `sfcmes-ai-${fileStamp()}.xlsx`);
    } catch {
      onError('ไม่สามารถสร้างไฟล์ Excel ได้');
    }
  };
  return (
    <button type="button" className="mes-btn mes-btn-ghost text-xs" onClick={download}>
      <Icon name="download" size={15} />
      <span className="max-w-[16rem] truncate">ดาวน์โหลด Excel — {dataset.title}</span>
    </button>
  );
}

export function ChatChart({ charts, datasets }) {
  const { showToast, toastNode } = useToast();
  const hasCharts = charts?.length > 0;
  const hasDatasets = datasets?.length > 0;
  if (!hasCharts && !hasDatasets) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {hasCharts && charts.map((chart) => (
        chart.type === 'donut'
          ? <DonutChart key={chart.id} chart={chart} />
          : chart.type === 'pipeline'
            ? <PipelineChart key={chart.id} chart={chart} />
            : null
      ))}
      {hasDatasets && (
        <div className="flex flex-wrap gap-2">
          {datasets.map((dataset, i) => (
            <DatasetChip key={`${dataset.title}-${i}`} dataset={dataset} onError={(m) => showToast(m, 'error')} />
          ))}
        </div>
      )}
      {toastNode}
    </div>
  );
}
