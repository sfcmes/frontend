// [MES] ProjectTable — project list: cards below md (no horizontal scroll),
// full table at md+. Pipeline bar visible at EVERY breakpoint.
import { useState, useMemo, useCallback } from 'react';
import { Icon } from 'src/components/mes/Icon';
import { Donut, PipelineBar } from 'src/components/mes/charts';
import { COMPONENT_STATUS, PIPE_ORDER, fmt, pct } from 'src/components/mes/status-meta';
import { EmptyState, CardHeader } from 'src/components/mes/ui';
import OtherComponentsTab from './OtherComponentsTab';

function ProjectCard({ project, selected, onSelect, onOpen }) {
  const inst = project.status.installed || 0;
  return (
    <button
      onClick={() => onSelect(project)}
      className={`mes-card w-full p-3 text-left ${selected ? 'border-mes-accent' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-sm bg-mes-surface-2 px-2 py-0.5 font-mono text-xs text-mes-muted">{project.code}</span>
        <span className="min-w-0 grow truncate text-sm font-semibold">{project.name}</span>
        <span
          className="mes-btn mes-btn-ghost !min-h-touch !px-3 shrink-0"
          role="link"
          onClick={(e) => { e.stopPropagation(); onOpen(project); }}
        >
          เปิด <Icon name="arrow-up-right" size={13} />
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-mes-muted tabular-nums">
        <span>{fmt(project.sectionCount)} ชั้น</span>
        <span>{fmt(project.total)} ชิ้นงาน</span>
        <span className="ml-auto font-semibold text-mes-text">{pct(inst, project.total).toFixed(0)}% ติดตั้ง</span>
      </div>
      <div className="mt-2">
        <PipelineBar status={project.status} order={PIPE_ORDER} meta={COMPONENT_STATUS} height={8} />
      </div>
    </button>
  );
}

function ProjectRow({ project, selected, onSelect, onOpen }) {
  const inst = project.status.installed || 0;
  const prog = pct(inst, project.total);
  return (
    <tr
      onClick={() => onSelect(project)}
      className={`cursor-pointer transition-colors hover:bg-mes-surface-2 ${selected ? 'bg-mes-surface-2' : ''}`}
      style={selected ? { boxShadow: 'inset 3px 0 0 var(--mes-accent)' } : undefined}
    >
      <td className="mes-td"><span className="rounded-sm bg-mes-surface-2 px-2 py-0.5 font-mono text-xs text-mes-muted">{project.code}</span></td>
      <td className="mes-td">
        <div className="max-w-[280px] truncate font-semibold">{project.name}</div>
      </td>
      <td className="mes-td text-right">{fmt(project.sectionCount)}</td>
      <td className="mes-td text-right font-semibold">{fmt(project.total)}</td>
      <td className="mes-td w-[26%] min-w-[140px]">
        <PipelineBar status={project.status} order={PIPE_ORDER} meta={COMPONENT_STATUS} height={8} />
      </td>
      <td className="mes-td">
        <div className="flex items-center gap-2 justify-end">
          <Donut
            segments={[
              { value: inst, cssVar: '--status-installed' },
              { value: Math.max(0, project.total - inst), cssVar: '--mes-surface-2' },
            ]}
            size={32} thickness={5}
          />
          <span className="tabular-nums text-sm">{prog.toFixed(0)}%</span>
        </div>
      </td>
      <td className="mes-td text-right">
        <button
          className="mes-btn mes-btn-ghost !min-h-0 !py-1.5 !px-3 text-xs"
          onClick={(e) => { e.stopPropagation(); onOpen(project); }}
        >
          เปิด <Icon name="arrow-up-right" size={13} />
        </button>
      </td>
    </tr>
  );
}

export function ProjectTable({ projects, selectedId, userRole, onSelect, onOpen }) {
  const [tab, setTab] = useState('pc');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return projects
      .filter(
        // total > 0: /api/projects includes projects tracked ONLY as ชิ้นงานอื่นๆ
        // (เสาเอ็น/บ่อ… codes, zero precast components) — they live in the other
        // tab; listing their empty rows here reads as swapped tabs.
        (p) =>
          p.kind === tab &&
          p.total > 0 &&
          (!s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s)),
      )
      // The API has no stable ordering — sort deterministically, biggest first.
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'th'));
  }, [projects, tab, q]);

  const clear = useCallback(() => setQ(''), []);

  return (
    <div className="mes-card min-w-0">
      <CardHeader
        title="ข้อมูลโครงการ"
        right={
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mes-muted"><Icon name="search" size={16} /></span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหารหัส / ชื่อโครงการ…"
              className="mes-input !pl-9 !min-h-touch md:!min-h-0 md:!py-2 w-[210px] md:w-[260px]"
            />
            {q && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-mes-muted" onClick={clear} aria-label="ล้างคำค้นหา">
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        }
      />

      <div className="flex gap-1 border-b border-mes-border px-3 pt-2">
        {[
          { id: 'pc', label: 'ชิ้นงานพรีคาสท์' },
          { id: 'other', label: 'ชิ้นงานอื่นๆ' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-touch md:min-h-0 rounded-t-sm px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-mes-accent text-mes-accent' : 'border-transparent text-mes-muted hover:text-mes-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'other' ? (
        <OtherComponentsTab userRole={userRole} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="search"
          title={q ? `ไม่พบโครงการที่ตรงกับ "${q}"` : 'ยังไม่มีโครงการ'}
        />
      ) : (
        <>
          {/* base: cards */}
          <div className="flex flex-col gap-2 p-3 md:hidden">
            {list.map((p) => (
              <ProjectCard key={p.id} project={p} selected={selectedId === p.id} onSelect={onSelect} onOpen={onOpen} />
            ))}
          </div>
          {/* md+: table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="mes-th">รหัสโครงการ</th>
                  <th className="mes-th">ชื่อโครงการ</th>
                  <th className="mes-th text-right">จำนวนชั้น</th>
                  <th className="mes-th text-right">จำนวนชิ้นงาน</th>
                  <th className="mes-th">สถานะการผลิต</th>
                  <th className="mes-th text-right">ติดตั้ง</th>
                  <th className="mes-th" />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <ProjectRow key={p.id} project={p} selected={selectedId === p.id} onSelect={onSelect} onOpen={onOpen} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
