import React, { useMemo } from 'react';
import { Icon, Donut, Sparkline } from './Primitives';
import { STATUS, CARD_ORDER, STAT_ICONS, fmt, pct, trendFor, toCumulativeStatus } from './utils';

function StatCard({ statKey, count, total, viz, idx }) {
  const m = STATUS[statKey];
  const p = pct(count, total);
  const pStr = p.toFixed(1);
  const spark = useMemo(() => trendFor(idx + 7, count), [idx, count]);

  const head = (
    <div className="stat-head">
      <span className="stat-dot" style={{ background: m.color }} />
      <span className="stat-label">{m.th}</span>
    </div>
  );

  let body;
  if (viz === 'donut') {
    body = (
      <div className="stat-body stat-row-flex">
        <Donut
          segments={[
            { value: count, color: m.color },
            { value: Math.max(0, total - count), color: '#EAEEF3' },
          ]}
          size={62} thickness={9} track="#EAEEF3"
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{Math.round(p)}%</div>
        </Donut>
        <div className="stat-donut-side">
          <div className="stat-num sm" style={{ color: m.color }}>{fmt(count)}</div>
          <div className="stat-sub">ชิ้นงาน</div>
        </div>
      </div>
    );
  } else if (viz === 'number') {
    body = (
      <div className="stat-body stat-row-flex" style={{ gap: 12 }}>
        <div className="stat-ic" style={{ background: m.soft, color: m.color }}>
          <Icon name={STAT_ICONS[statKey]} size={22} />
        </div>
        <div>
          <div className="stat-num" style={{ color: 'var(--ink)' }}>{fmt(count)}</div>
          <div className="stat-chip" style={{ color: m.color, background: m.soft }}>
            <Icon name="trend-up" size={12} /> {pStr}%
          </div>
        </div>
      </div>
    );
  } else if (viz === 'spark') {
    body = (
      <div className="stat-body">
        <div className="stat-spark-top">
          <span className="stat-num sm" style={{ color: m.color }}>{fmt(count)}</span>
          <span className="stat-sub"><b style={{ color: m.color }}>{pStr}%</b></span>
        </div>
        <div className="stat-spark">
          <Sparkline points={spark} color={m.color} width={150} height={34} />
        </div>
      </div>
    );
  } else {
    // bar (default)
    body = (
      <div className="stat-body">
        <div className="stat-num" style={{ color: m.color }}>{fmt(count)}</div>
        <div className="stat-sub"><b>{pStr}%</b> ของทั้งหมด</div>
        <div className="stat-track">
          <div className="stat-fill" style={{ width: `${p}%`, background: m.color }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stat" data-viz={viz}>
      <span className="stat-edge" style={{ background: m.color }} />
      {head}
      {body}
    </div>
  );
}

export function Hero({ agg, viz, accent, projectCount, scope, onReset }) {
  // Milestone widget: derive cumulative counts at display time (raw stays in the model).
  const cumulative = useMemo(() => toCumulativeStatus(agg.counts), [agg.counts]);
  const installed = cumulative.installed || 0;
  const overall = pct(installed, agg.total);

  return (
    <section className="mes-hero">
      <div className="hero-clouds" aria-hidden="true" />
      <div className="hero-glass">
        <div className="hero-top">
          <div>
            <div className="hero-eyebrow">
              <Icon name="aperture" size={15} /> ภาพรวมสถานะโครงการ
              {onReset && (
                <button className="hero-reset" onClick={onReset}>
                  กำลังดูเฉพาะโครงการนี้ · ดูทั้งหมด <Icon name="x" size={12} />
                </button>
              )}
            </div>
            <h1 className="hero-title">{scope}</h1>
            <div className="hero-meta">
              <span><b>{fmt(agg.total)}</b> ชิ้นงาน</span>
              <i />
              <span><b>{projectCount}</b> โครงการ</span>
              <i />
              <span>อัปเดต <b>5 นาที</b> ที่แล้ว</span>
            </div>
          </div>
          <div className="hero-overall">
            <Donut
              segments={[
                { value: installed, color: '#2E9E5B' },
                { value: Math.max(0, agg.total - installed), color: 'rgba(20,40,70,.12)' },
              ]}
              size={68} thickness={8} track="rgba(20,40,70,.12)"
            >
              <div className="hero-overall-num">{overall.toFixed(0)}<span>%</span></div>
            </Donut>
            <div>
              <div className="hero-overall-cap-t">ติดตั้งสำเร็จ</div>
              <div className="hero-overall-cap-s">{fmt(installed)} / {fmt(agg.total)} ชิ้น</div>
            </div>
          </div>
        </div>

        <div className="stat-row">
          {CARD_ORDER.map((k, i) => (
            <StatCard
              key={k}
              statKey={k}
              count={cumulative[k] || 0}
              total={agg.total}
              viz={viz}
              idx={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
