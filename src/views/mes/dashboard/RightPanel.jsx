// [MES] RightPanel — selected-project summary: site photos, KPIs, status breakdown.
import { Icon } from 'src/components/mes/Icon';
import { Donut } from 'src/components/mes/charts';
import { COMPONENT_STATUS, PIPE_ORDER, toCumulativeStatus, fmt, pct } from 'src/components/mes/status-meta';
import { EmptyState } from 'src/components/mes/ui';
import { SitePhotos } from './SitePhotos';

function StatBreakdown({ project }) {
  const counts = toCumulativeStatus(project.status);
  return (
    <div className="flex flex-col gap-1.5">
      {PIPE_ORDER.map((k) => {
        const m = COMPONENT_STATUS[k];
        const v = counts[k] || 0;
        const p = pct(v, project.total);
        return (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `var(${m.cssVar})` }} />
            <span className="w-20 shrink-0 text-mes-muted">{m.th}</span>
            <span className="h-1.5 grow overflow-hidden rounded-full bg-mes-surface-2">
              <span className="block h-full rounded-full" style={{ width: `${p}%`, background: `var(${m.cssVar})` }} />
            </span>
            <span className="w-10 text-right tabular-nums">{fmt(v)}</span>
            <span className="w-10 text-right tabular-nums text-mes-muted">{p.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function RightPanel({ project, userRole, onOpen }) {
  if (!project) {
    return (
      <aside className="mes-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="photo" size={17} /> ภาพรวมโครงการ
        </div>
        <EmptyState
          icon="box"
          title="เลือกโครงการเพื่อดูรูปและสถิติ"
          hint="คลิกแถวในตารางด้านซ้ายเพื่อแสดงรูปไซต์งานและความคืบหน้าการผลิต"
        />
      </aside>
    );
  }

  const inst = project.status.installed || 0;
  const prog = pct(inst, project.total);

  return (
    <aside className="mes-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon name="photo" size={17} /> ภาพรวมโครงการ
        <span className="ml-auto rounded-sm bg-mes-surface-2 px-2 py-0.5 font-mono text-xs text-mes-muted">{project.code}</span>
      </div>

      <div className="mt-3">
        <SitePhotos project={project} userRole={userRole} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-sm bg-mes-surface-2 p-2">
          <div className="text-lg font-bold tabular-nums">{fmt(project.sections.length || project.sectionCount)}</div>
          <div className="text-xs text-mes-muted">ชั้น</div>
        </div>
        <div className="rounded-sm bg-mes-surface-2 p-2">
          <div className="text-lg font-bold tabular-nums">{fmt(project.total)}</div>
          <div className="text-xs text-mes-muted">ชิ้นงาน</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-sm bg-mes-surface-2 p-2">
          <Donut
            segments={[
              { value: inst, cssVar: '--status-installed' },
              { value: Math.max(0, project.total - inst), cssVar: '--mes-surface' },
            ]}
            size={40} thickness={5}
          >
            <span className="text-[10px] font-bold tabular-nums">{prog.toFixed(0)}%</span>
          </Donut>
          <div className="mt-0.5 text-xs text-mes-muted">ติดตั้งแล้ว</div>
        </div>
      </div>

      <div className="mt-4 text-xs font-semibold text-mes-muted">สถานะการผลิต</div>
      <div className="mt-2"><StatBreakdown project={project} /></div>

      <div className="mt-4 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-2 text-mes-muted"><Icon name="box" size={14} /> ประเภทชิ้นงาน <b className="ml-auto text-mes-text">{project.type}</b></div>
        <div className="flex items-center gap-2 text-mes-muted"><Icon name="user" size={14} /> ผู้รับผิดชอบ <b className="ml-auto text-mes-text">{project.mgr}</b></div>
        <div className="flex items-center gap-2 text-mes-muted"><Icon name="calendar" size={14} /> อัปเดตล่าสุด <b className="ml-auto text-mes-text">{project.updated}</b></div>
      </div>

      <button className="mes-btn mes-btn-primary mt-4 w-full" onClick={() => onOpen(project)}>
        <Icon name="maximize" size={15} /> ดูรายละเอียดโครงการเต็ม
      </button>
    </aside>
  );
}
