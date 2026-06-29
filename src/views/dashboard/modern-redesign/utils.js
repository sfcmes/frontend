// Status metadata for the MES pipeline
export const STATUS = {
  planning:     { key: 'planning',     th: 'รอผลิต',      color: '#64748B', soft: '#EEF1F5' },
  manufactured: { key: 'manufactured', th: 'ผลิตแล้ว',     color: '#2E9E5B', soft: '#E7F4EC' },
  transported:  { key: 'transported',  th: 'ขนส่งสำเร็จ',  color: '#E08A00', soft: '#FBF0DC' },
  accepted:     { key: 'accepted',     th: 'ตรวจรับแล้ว',  color: '#7E3FB0', soft: '#F1E9F8' },
  installed:    { key: 'installed',    th: 'ติดตั้งแล้ว',   color: '#0E9B96', soft: '#DEF3F2' },
  rejected:     { key: 'rejected',     th: 'ถูกปฏิเสธ',    color: '#DC4B4B', soft: '#FBE7E7' },
};

export const CARD_ORDER = ['manufactured', 'transported', 'accepted', 'installed', 'rejected'];
export const PIPE_ORDER = ['planning', 'manufactured', 'transported', 'accepted', 'installed', 'rejected'];

export const STAT_ICONS = {
  manufactured: 'factory', transported: 'truck', accepted: 'clipboard-check',
  installed: 'circle-check', rejected: 'circle-x',
};

// Pipeline stages that accumulate forward. A piece at 'accepted' has also passed
// through 'manufactured' and 'transported'. 'planning' and 'rejected' are not part
// of this pipe — they stay point-in-time.
const CUMULATIVE_PIPE = ['manufactured', 'transported', 'accepted', 'installed'];

// Display-layer helper: derive cumulative milestone counts from a RAW point-in-time
// status object. Non-mutating. Walks CUMULATIVE_PIPE backwards so each stage absorbs
// every later stage (accepted += installed, transported += accepted, manufactured += transported).
// 'planning' and 'rejected' pass through untouched. Use this ONLY in milestone widgets
// (independent per-status %); partition widgets (PipelineBar, aggregate donuts) keep raw.
export function toCumulativeStatus(raw) {
  const cum = { ...emptyStatus(), ...raw };
  for (let i = CUMULATIVE_PIPE.length - 2; i >= 0; i--) {
    cum[CUMULATIVE_PIPE[i]] += cum[CUMULATIVE_PIPE[i + 1]];
  }
  return cum;
}

export const ICON_PATHS = {
  'aperture': 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M3.6 15h10.55 M6.551 4.938l3.26 10.034 M17.032 4.636l-8.535 6.201 M20.559 14.51l-8.535 -6.201 M12.257 20.916l3.261 -10.034',
  'home-plus': 'M19 12h2l-9 -9l-9 9h2v7a2 2 0 0 0 2 2h5.5 M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2 M16 19h6 M19 16v6',
  'brand-codepen': 'M3 15l9 6l9 -6l-9 -6l-9 6 M3 9l9 6l9 -6l-9 -6l-9 6 M3 9l0 6 M21 9l0 6 M12 3l0 6 M12 15l0 6',
  'zoom-code': 'M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M21 21l-6 -6 M8 8l-2 2l2 2 M12 8l2 2l-2 2',
  'qrcode': 'M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z M7 17l0 .01 M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z M7 7l0 .01 M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z M17 7l0 .01 M14 14l3 0 M20 14l0 .01 M14 14l0 3 M14 20l3 0 M17 17l3 0 M20 17l0 3',
  'star': 'M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z',
  'login': 'M15 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2 M21 12h-13l3 -3 M11 15l-3 -3',
  'user-plus': 'M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0 M16 19h6 M19 16v6 M6 21v-2a4 4 0 0 1 4 -4h4',
  'menu-2': 'M4 6l16 0 M4 12l16 0 M4 18l16 0',
  'search': 'M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M21 21l-6 -6',
  'language': 'M4 5h7 M9 3v2c0 4.418 -2.239 8 -5 8 M5 9c0 2.144 2.952 3.908 6.7 4 M12 20l4 -9l4 9 M19.1 18h-6.2',
  'bell': 'M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6 M9 17v1a3 3 0 0 0 6 0v-1',
  'chevron-down': 'M6 9l6 6l6 -6',
  'chevron-up': 'M6 15l6 -6l6 6',
  'chevron-right': 'M9 6l6 6l-6 6',
  'chevron-left': 'M15 6l-6 6l6 6',
  'zoom-in': 'M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M21 21l-6 -6 M10 7v6 M7 10h6',
  'zoom-out': 'M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M21 21l-6 -6 M7 10h6',
  'trash': 'M4 7l16 0 M10 11l0 6 M14 11l0 6 M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12 M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3',
  'upload': 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2 M7 9l5 -5l5 5 M12 4l0 12',
  'factory': 'M3 21h18 M5 21v-12l5 4v-4l5 4h4 M19 21v-8l-1.436 -9.574a.5 .5 0 0 0 -.495 -.426h-1.145a.5 .5 0 0 0 -.494 .418l-1.43 8.582 M9 17h1 M14 17h1',
  'truck': 'M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5 M3 9l4 0',
  'clipboard-check': 'M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2 M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z M9 14l2 2l4 -4',
  'circle-check': 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M9 12l2 2l4 -4',
  'circle-x': 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M10 10l4 4m0 -4l-4 4',
  'check': 'M5 12l5 5l10 -10',
  'x': 'M18 6l-12 12 M6 6l12 12',
  'tools': 'M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4 M14.5 5.5l4 4 M12 8l-5 -5l-4 4l5 5 M7 8l-1.5 1.5 M16 12l5 5l-4 4l-5 -5 M16 17l-1.5 1.5',
  'box': 'M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5 M12 12l8 -4.5 M12 12l0 9 M12 12l-8 -4.5',
  'clipboard-list': 'M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2 M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z M9 12l.01 0 M13 12l2 0 M9 16l.01 0 M13 16l2 0',
  'file-invoice': 'M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z M9 7l1 0 M9 13l6 0 M13 17l-4 0',
  'alert-triangle': 'M12 9v4 M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z M12 16h.01',
  'map-pin': 'M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0 M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z',
  'calendar': 'M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z M16 3v4 M8 3v4 M4 11h16',
  'user': 'M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0 M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2',
  'photo': 'M15 8h.01 M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5 M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3',
  'maximize': 'M4 8v-2a2 2 0 0 1 2 -2h2 M4 16v2a2 2 0 0 1 2 2h2 M16 4h2a2 2 0 0 1 2 2v2 M16 20h2a2 2 0 0 1 2 -2v-2',
  'arrow-up-right': 'M17 7l-10 10 M8 7l9 0l0 9',
  'dots': 'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
  'refresh': 'M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4 M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4',
  'point': 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
  'trend-up': 'M3 17l6 -6l4 4l8 -8 M14 7l7 0l0 7',
  'plus': 'M12 5l0 14 M5 12l14 0',
  'logout': 'M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2 M9 12h12l-3 -3 M18 15l3 -3',
  'arrow-left': 'M5 12l14 0 M5 12l6 6 M5 12l6 -6',
  'ruler': 'M5 4h14a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-7a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 -1 -1h-5a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1z M4 13l0 .01 M8 13l0 .01 M12 13l0 .01 M16 13l0 .01 M20 13l0 .01 M4 17l0 .01 M20 17l0 .01 M4 21l16 0',
  'weight': 'M12 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M6.835 9h10.33a1 1 0 0 1 .984 .821l1.637 9a1 1 0 0 1 -.984 1.179h-13.604a1 1 0 0 1 -.984 -1.179l1.637 -9a1 1 0 0 1 .984 -.821z',
  'clock': 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 7v5l3 3',
  'file-text': 'M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z M9 9l1 0 M9 13l6 0 M9 17l6 0',
  'download': 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2 M7 11l5 5l5 -5 M12 4l0 12',
  'hash': 'M5 9l14 0 M5 15l14 0 M11 4l-4 16 M17 4l-4 16',
  'cube': 'M21 16.008v-8.018a1.98 1.98 0 0 0 -1 -1.717l-7 -4.008a2.02 2.02 0 0 0 -2 0l-7 4.008c-.619 .355 -1 1.01 -1 1.718v8.018c0 .709 .381 1.363 1 1.717l7 4.008a2.02 2.02 0 0 0 2 0l7 -4.008c.619 -.355 1 -1.01 1 -1.717z M12 22v-10 M12 12l8.73 -5.04 M3.27 6.96l8.73 5.04',
  'scan': 'M4 7v-1a2 2 0 0 1 2 -2h2 M4 17v1a2 2 0 0 0 2 2h2 M16 4h2a2 2 0 0 1 2 2v1 M16 20h2a2 2 0 0 1 2 -2v-1 M5 12l14 0',
  'settings': 'M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
};

export function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-US');
}

export function pct(n, total) {
  return total > 0 ? (n / total) * 100 : 0;
}

export function trendFor(seed, end, len = 9) {
  let a = ((seed * 2654435761) >>> 0);
  const rand = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [];
  let v = end * (0.35 + rand() * 0.2);
  for (let i = 0; i < len; i++) {
    v += (end - v) * (0.18 + rand() * 0.25) + (rand() - 0.5) * end * 0.08;
    arr.push(Math.max(0, v));
  }
  arr[len - 1] = end;
  return arr;
}

export function emptyStatus() {
  return { planning: 0, manufactured: 0, transported: 0, accepted: 0, installed: 0, rejected: 0 };
}

// Builds the RAW point-in-time status counts. Cumulative milestone counts are
// derived at the display layer via toCumulativeStatus — never stored in the model.
export function buildStatusFromComponents(compRes) {
  const status = emptyStatus();
  const allComps = Array.isArray(compRes?.precast)
    ? [...compRes.precast, ...(compRes.other || [])]
    : Array.isArray(compRes) ? compRes : [];
  allComps.forEach((c) => {
    const st = c.status || 'planning';
    if (status[st] !== undefined) status[st]++;
  });
  return status;
}

export function aggregateStatus(projects) {
  const totals = emptyStatus();
  let total = 0;
  projects.forEach((p) => {
    PIPE_ORDER.forEach((k) => { totals[k] += (p.status[k] || 0); });
    total += p.total || 0;
  });
  return { counts: totals, total };
}

// Transform API project for table (without full component data)
export function transformProjectBasic(apiProject) {
  const sectionCount = parseInt(apiProject.sections, 10) || 0;
  const componentCount = parseInt(apiProject.components, 10) || 0;

  // Create placeholder sections
  const sections = Array.from({ length: sectionCount }, (_, i) => ({
    id: `${apiProject.id}-s${i + 1}`,
    name: `ชั้น ${i + 1}`,
    total: Math.floor(componentCount / Math.max(sectionCount, 1)),
    status: emptyStatus(),
    sampleType: 'ชิ้นงานพรีคาสท์',
  }));

  return {
    id: apiProject.id,
    code: apiProject.project_code || String(apiProject.id).slice(0, 6).toUpperCase(),
    name: apiProject.name || '—',
    site: '—',
    type: 'พรีคาสท์',
    mgr: apiProject.created_by || '—',
    updated: apiProject.updated_at
      ? new Date(apiProject.updated_at).toLocaleDateString('th-TH')
      : '—',
    kind: 'pc',
    sections,
    status: emptyStatus(),
    total: componentCount,
    _raw: apiProject,
    _loaded: false,
  };
}
