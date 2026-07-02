// [MES] dashboard data transforms — API → view model. No fake placeholder data:
// sections stay empty until the drawer fetches real ones (ADR-0005).
import { emptyStatus, PIPE_ORDER } from 'src/components/mes/status-meta';

export function transformProjectBasic(apiProject) {
  const sectionCount = parseInt(apiProject.sections, 10) || 0;
  const componentCount = parseInt(apiProject.components, 10) || 0;
  return {
    id: apiProject.id,
    code: apiProject.project_code || String(apiProject.id).slice(0, 6).toUpperCase(),
    name: apiProject.name || '—',
    type: 'พรีคาสท์',
    mgr: apiProject.created_by || '—',
    updated: apiProject.updated_at
      ? new Date(apiProject.updated_at).toLocaleDateString('th-TH')
      : '—',
    kind: 'pc',
    sectionCount,
    sections: [],
    status: emptyStatus(),
    total: componentCount,
    _raw: apiProject,
  };
}

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
