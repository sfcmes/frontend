import React, { useState, useMemo, useCallback } from 'react';
import { Icon, Donut, PipelineBar } from './Primitives';
import { STATUS, PIPE_ORDER, fmt, pct } from './utils';
import OtherProjectsTab from './OtherProjectsTab';

function SectionDetail({ project }) {
  return (
    <div className="sec-wrap">
      <div className="sec-head-row">
        <span><Icon name="brand-codepen" size={15} /> รายการชั้น ({project.sections.length})</span>
        <span className="sec-head-hint">ชั้น · จำนวนชิ้น · สถานะ</span>
      </div>
      <div className="sec-list">
        {project.sections.slice(0, 8).map((s) => {
          const inst = s.status.installed || 0;
          return (
            <div key={s.id} className="sec-row">
              <span className="sec-name">
                <Icon name="point" size={10} style={{ color: 'var(--ink3)' }} /> {s.name}
              </span>
              <span className="sec-type">{s.sampleType}</span>
              <span className="sec-count">{fmt(s.total)} ชิ้น</span>
              <span className="sec-bar">
                <PipelineBar status={s.status} order={PIPE_ORDER} meta={STATUS} height={7} />
              </span>
              <span className="sec-prog">{pct(inst, s.total).toFixed(0)}%</span>
            </div>
          );
        })}
        {project.sections.length > 8 && (
          <div className="sec-more">+ อีก {project.sections.length - 8} ชั้น</div>
        )}
      </div>
    </div>
  );
}

function ProjectRow({ project, selectedId, expanded, density, onSelect, onToggle, onOpen }) {
  const inst = project.status.installed || 0;
  const prog = pct(inst, project.total);
  const pad = 6 + density * 4;
  const sel = selectedId === project.id;

  return (
    <>
      <tr
        className={'prow' + (sel ? ' is-sel' : '')}
        onClick={() => onSelect(project)}
        style={{ '--rpad': pad + 'px' }}
      >
        <td className="c-exp">
          <button
            className="exp-btn"
            onClick={(e) => { e.stopPropagation(); onToggle(project.id); }}
            aria-label="expand"
          >
            <Icon
              name="chevron-right" size={16}
              style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .16s' }}
            />
          </button>
        </td>
        <td className="c-code"><span className="code-chip">{project.code}</span></td>
        <td className="c-name">
          <div className="name-main">{project.name}</div>
          <div className="name-sub"><Icon name="map-pin" size={12} /> {project.site}</div>
        </td>
        <td className="c-num">{fmt(project.sections.length)}</td>
        <td className="c-num strong">{fmt(project.total)}</td>
        <td className="c-pipe">
          <PipelineBar status={project.status} order={PIPE_ORDER} meta={STATUS} height={8} />
          <div className="pipe-legend">
            {PIPE_ORDER.filter((k) => k !== 'planning').map((k) => (
              <span key={k}><i style={{ background: STATUS[k].color }} />{fmt(project.status[k] || 0)}</span>
            ))}
          </div>
        </td>
        <td className="c-prog">
          <div className="prog-mini">
            <Donut
              segments={[
                { value: inst, color: '#2E9E5B' },
                { value: Math.max(0, project.total - inst), color: '#EAEEF3' },
              ]}
              size={34} thickness={5} track="#EAEEF3"
            />
            <span>{prog.toFixed(0)}%</span>
          </div>
        </td>
        <td className="c-act">
          <button className="open-btn" onClick={(e) => { e.stopPropagation(); onOpen(project); }}>
            เปิด <Icon name="arrow-up-right" size={13} />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="prow-detail">
          <td colSpan={8}>
            <SectionDetail project={project} />
            <div className="detail-cta">
              <button className="open-btn solid" onClick={() => onOpen(project)}>
                <Icon name="maximize" size={14} /> ดูรายละเอียดโครงการเต็ม
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ProjectTable({ projects, accent, density, selectedId, userRole, onSelect, onOpen }) {
  const [tab, setTab] = useState('pc');
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState({});
  const toggle = useCallback((id) => setExpanded((e) => ({ ...e, [id]: !e[id] })), []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return projects.filter((p) =>
      p.kind === tab && (!s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s)),
    );
  }, [projects, tab, q]);

  const counts = useMemo(() => ({
    pc: projects.filter((p) => p.kind === 'pc').length,
    other: projects.filter((p) => p.kind === 'other').length,
  }), [projects]);

  return (
    <div className="mes-card table-card">
      <div className="tc-head">
        <div>
          <h2 className="tc-title">ข้อมูลโครงการ</h2>
          <div className="tc-sub">
            <span className="role-pill"><Icon name="user" size={12} /> Admin</span>
            ดูและจัดการได้ทุกโครงการ
          </div>
        </div>
        <div className="tc-search">
          <Icon name="search" size={17} style={{ color: 'var(--ink3)' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหารหัส / ชื่อโครงการ…"
          />
          {q && (
            <button className="tc-clear" onClick={() => setQ('')}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="mes-tabs" style={{ '--accent': accent }}>
        <button
          className={'mes-tab' + (tab === 'pc' ? ' is-active' : '')}
          onClick={() => setTab('pc')}
        >
          ชิ้นงานพรีคาสท์ <em>{counts.pc}</em>
        </button>
        <button
          className={'mes-tab' + (tab === 'other' ? ' is-active' : '')}
          onClick={() => setTab('other')}
        >
          ชิ้นงานอื่นๆ <em>{counts.other}</em>
        </button>
      </div>

      {tab === 'other' ? (
        <OtherProjectsTab userRole={userRole} />
      ) : (
        <div className="table-scroll">
          <table className="ptable">
            <thead>
              <tr>
                <th className="c-exp" />
                <th>รหัสโครงการ</th>
                <th>ชื่อโครงการ</th>
                <th className="c-num">จำนวนชั้น</th>
                <th className="c-num">จำนวนชิ้นงาน</th>
                <th className="c-pipe">สถานะการผลิต</th>
                <th className="c-prog">ติดตั้ง</th>
                <th className="c-act" />
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                list.map((p) => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    selectedId={selectedId}
                    expanded={!!expanded[p.id]}
                    density={density}
                    onSelect={onSelect}
                    onToggle={toggle}
                    onOpen={onOpen}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="tbl-empty">
                    <Icon name="search" size={24} style={{ color: 'var(--ink3)' }} />
                    <div style={{ marginTop: 8, fontSize: 13 }}>
                      {q ? `ไม่พบโครงการที่ตรงกับ "${q}"` : 'ยังไม่มีโครงการ'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
