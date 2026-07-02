// [MES] Hero — dashboard header: scope, totals, overall installed donut,
// 5 cumulative milestone stat cards. Real data only (no fake trends/freshness).
import { useMemo } from 'react';
import { Icon } from 'src/components/mes/Icon';
import { Donut } from 'src/components/mes/charts';
import { COMPONENT_STATUS, CARD_ORDER, toCumulativeStatus, fmt, pct } from 'src/components/mes/status-meta';

const STAT_ICONS = {
  manufactured: 'factory',
  transported: 'truck',
  accepted: 'clipboard-check',
  installed: 'circle-check',
  rejected: 'circle-x',
};

function StatCard({ statKey, count, total }) {
  const m = COMPONENT_STATUS[statKey];
  const p = pct(count, total);
  return (
    <div className="mes-card relative overflow-hidden p-3 md:p-4">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: `var(${m.cssVar})` }} />
      <div className="flex items-center gap-2 text-xs font-semibold text-mes-muted">
        <span style={{ color: `var(${m.cssVar})` }}><Icon name={STAT_ICONS[statKey]} size={16} /></span>
        {m.th}
      </div>
      <div className="mt-1.5 text-xl md:text-2xl font-bold tabular-nums" style={{ color: `var(${m.cssVar})` }}>
        {fmt(count)}
      </div>
      <div className="text-xs text-mes-muted"><b className="text-mes-text">{p.toFixed(1)}%</b> ของทั้งหมด</div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mes-surface-2">
        <div className="h-full rounded-full" style={{ width: `${p}%`, background: `var(${m.cssVar})` }} />
      </div>
    </div>
  );
}

export function Hero({ agg, projectCount, scope, onReset }) {
  const cumulative = useMemo(() => toCumulativeStatus(agg.counts), [agg.counts]);
  const installed = cumulative.installed || 0;
  const overall = pct(installed, agg.total);

  return (
    <section className="mb-4">
      <div className="mes-card bg-mes-surface p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="min-w-0 grow">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-mes-muted">
              <Icon name="aperture" size={15} /> ภาพรวมสถานะโครงการ
              {onReset && (
                <button
                  onClick={onReset}
                  className="inline-flex items-center gap-1 rounded-full border border-mes-border px-2.5 py-1 text-xs text-mes-accent hover:bg-mes-surface-2"
                >
                  กำลังดูเฉพาะโครงการนี้ · ดูทั้งหมด <Icon name="x" size={12} />
                </button>
              )}
            </div>
            <h1 className="mt-1 truncate text-xl md:text-2xl font-bold">{scope}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mes-muted">
              <span><b className="text-mes-text tabular-nums">{fmt(agg.total)}</b> ชิ้นงาน</span>
              <span><b className="text-mes-text tabular-nums">{projectCount}</b> โครงการ</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Donut
              segments={[
                { value: installed, cssVar: '--status-installed' },
                { value: Math.max(0, agg.total - installed), cssVar: '--mes-surface-2' },
              ]}
              size={68} thickness={8}
            >
              <span className="text-sm font-bold tabular-nums">{overall.toFixed(0)}<span className="text-[10px]">%</span></span>
            </Donut>
            <div>
              <div className="text-sm font-semibold">ติดตั้งสำเร็จ</div>
              <div className="text-xs text-mes-muted tabular-nums">{fmt(installed)} / {fmt(agg.total)} ชิ้น</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 md:gap-3">
          {CARD_ORDER.map((k) => (
            <StatCard key={k} statKey={k} count={cumulative[k] || 0} total={agg.total} />
          ))}
        </div>
      </div>
    </section>
  );
}
