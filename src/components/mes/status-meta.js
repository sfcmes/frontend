// [MES] status-meta — THE single source of truth for every status in the UI.
// Canonical keys + Thai labels per CONTEXT.md (one status = one label).
// Colors are CSS variable references into tokens.css — never hex.

export const COMPONENT_STATUS = {
  planning:     { key: 'planning',     th: 'รอผลิต',     cssVar: '--status-planning' },
  manufactured: { key: 'manufactured', th: 'ผลิตแล้ว',    cssVar: '--status-manufactured' },
  transported:  { key: 'transported',  th: 'ขนส่งสำเร็จ', cssVar: '--status-transported' },
  accepted:     { key: 'accepted',     th: 'ตรวจรับแล้ว', cssVar: '--status-accepted' },
  installed:    { key: 'installed',    th: 'ติดตั้งแล้ว',  cssVar: '--status-installed' },
  rejected:     { key: 'rejected',     th: 'ถูกปฏิเสธ',   cssVar: '--status-rejected' },
};

// Full pipeline order (partition widgets: PipelineBar, aggregate donuts)
export const PIPE_ORDER = ['planning', 'manufactured', 'transported', 'accepted', 'installed', 'rejected'];
// Hero stat cards (no planning)
export const CARD_ORDER = ['manufactured', 'transported', 'accepted', 'installed', 'rejected'];

export const PO_STATUS = {
  draft:     { key: 'draft',     th: 'ฉบับร่าง',   cssVar: '--status-po-draft' },
  submitted: { key: 'submitted', th: 'รอสั่งซื้อ',  cssVar: '--status-po-submitted' },
  ordered:   { key: 'ordered',   th: 'สั่งซื้อแล้ว', cssVar: '--status-po-ordered' },
  received:  { key: 'received',  th: 'รับของแล้ว',  cssVar: '--status-po-received' },
};

export const PO_ORDER = ['draft', 'submitted', 'ordered', 'received'];

// Section / project management enums render via semantic tokens — they are
// NOT workflow statuses and must not reuse --status-* (TOKEN.md §4b).
export const SEM_STATUS = {
  // section enum
  planning:    { th: 'แผนผลิต',  cssVar: '--sem-neutral' },
  in_progress: { th: 'ผลิต',     cssVar: '--sem-info' },
  completed:   { th: 'เสร็จแล้ว', cssVar: '--sem-success' },
  on_hold:     { th: 'On Hold',  cssVar: '--sem-warn' },
  // project enum (English values stored by API)
  'Planning':    { th: 'Planning',    cssVar: '--sem-neutral' },
  'In Progress': { th: 'In Progress', cssVar: '--sem-info' },
  'Completed':   { th: 'Completed',   cssVar: '--sem-success' },
  'On Hold':     { th: 'On Hold',     cssVar: '--sem-warn' },
};

export const statusColor = (meta) => `var(${meta.cssVar})`;

export const resolveComponentStatus = (key) => COMPONENT_STATUS[key] || COMPONENT_STATUS.planning;
export const resolvePOStatus = (key) => PO_STATUS[key] || { key, th: key, cssVar: '--sem-neutral' };
export const resolveSemStatus = (key) => SEM_STATUS[key] || { th: key, cssVar: '--sem-neutral' };

// Cumulative milestone derivation (display layer ONLY — model stays raw).
const CUMULATIVE_PIPE = ['manufactured', 'transported', 'accepted', 'installed'];
export function emptyStatus() {
  return { planning: 0, manufactured: 0, transported: 0, accepted: 0, installed: 0, rejected: 0 };
}
export function toCumulativeStatus(raw) {
  const cum = { ...emptyStatus(), ...raw };
  for (let i = CUMULATIVE_PIPE.length - 2; i >= 0; i--) {
    cum[CUMULATIVE_PIPE[i]] += cum[CUMULATIVE_PIPE[i + 1]];
  }
  return cum;
}

export function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-US');
}
export function pct(n, total) {
  return total > 0 ? (n / total) * 100 : 0;
}
