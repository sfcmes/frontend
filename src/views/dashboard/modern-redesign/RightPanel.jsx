import React from 'react';
import { Icon, Donut } from './Primitives';
import { STATUS, PIPE_ORDER, fmt, pct, toCumulativeStatus } from './utils';
import { SitePhotos } from './SitePhotos';

function StatBreakdown({ project }) {
  // Milestone widget: per-status bars are independent (% of total), so show
  // cumulative counts to stay consistent with the Hero. Raw stays in the model.
  const counts = toCumulativeStatus(project.status);
  return (
    <div className="rp-breakdown">
      {PIPE_ORDER.map((k) => {
        const v = counts[k] || 0;
        const pc = pct(v, project.total);
        return (
          <div key={k} className="rp-brk-row">
            <span className="rp-brk-dot" style={{ background: STATUS[k].color }} />
            <span className="rp-brk-label">{STATUS[k].th}</span>
            <span className="rp-brk-track">
              <span style={{ width: `${pc}%`, background: STATUS[k].color }} />
            </span>
            <span className="rp-brk-val">{fmt(v)}</span>
            <span className="rp-brk-pc">{pc.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function RightPanel({ project, userRole, onOpen }) {
  if (!project) {
    return (
      <aside className="mes-card right-panel">
        <div className="rp-head">
          <Icon name="photo" size={17} /> <span>ภาพรวมโครงการ</span>
          <em>All Projects</em>
        </div>
        <div className="rp-empty">
          <div className="rp-empty-ic"><Icon name="box" size={30} /></div>
          <div className="rp-empty-t">เลือกโครงการเพื่อดูรูปและสถิติ</div>
          <div className="rp-empty-s">
            คลิกแถวในตารางด้านซ้ายเพื่อแสดงรูปไซต์งานและความคืบหน้าการผลิต
          </div>
        </div>
      </aside>
    );
  }

  const inst = project.status.installed || 0;
  const prog = pct(inst, project.total);

  return (
    <aside className="mes-card right-panel">
      <div className="rp-head">
        <Icon name="photo" size={17} /> <span>ภาพรวมโครงการ</span>
        <em>{project.code}</em>
      </div>

      <SitePhotos project={project} userRole={userRole} />

      <div className="rp-kpis">
        <div className="rp-kpi">
          <div className="rp-kpi-v">{fmt(project.sections.length)}</div>
          <div className="rp-kpi-l">ชั้น</div>
        </div>
        <div className="rp-kpi">
          <div className="rp-kpi-v">{fmt(project.total)}</div>
          <div className="rp-kpi-l">ชิ้นงาน</div>
        </div>
        <div className="rp-kpi rp-kpi-donut">
          <Donut
            segments={[
              { value: inst, color: '#2E9E5B' },
              { value: Math.max(0, project.total - inst), color: '#EAEEF3' },
            ]}
            size={46} thickness={6} track="#EAEEF3"
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2E9E5B' }}>
              {prog.toFixed(0)}%
            </div>
          </Donut>
          <div className="rp-kpi-l">ติดตั้งแล้ว</div>
        </div>
      </div>

      <div className="rp-section-t">สถานะการผลิต</div>
      <StatBreakdown project={project} />

      <div className="rp-meta">
        <div className="rp-meta-row">
          <Icon name="box" size={14} /><span>ประเภทชิ้นงาน</span><b>{project.type}</b>
        </div>
        <div className="rp-meta-row">
          <Icon name="user" size={14} /><span>ผู้รับผิดชอบ</span><b>{project.mgr}</b>
        </div>
        <div className="rp-meta-row">
          <Icon name="map-pin" size={14} /><span>ไซต์งาน</span><b>{project.site}</b>
        </div>
        <div className="rp-meta-row">
          <Icon name="calendar" size={14} /><span>อัปเดตล่าสุด</span><b>{project.updated}</b>
        </div>
      </div>

      <button className="rp-open" onClick={() => onOpen(project)}>
        <Icon name="maximize" size={15} /> ดูรายละเอียดโครงการเต็ม
      </button>
    </aside>
  );
}
