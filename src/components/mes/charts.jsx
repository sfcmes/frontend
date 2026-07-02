// [MES] charts — token-driven SVG primitives. The only place besides
// StatusBadge where status colors render (status-encoding data viz).

// Stacked proportion bar over a raw status object.
export function PipelineBar({ status, order, meta, height = 8, className = '' }) {
  const total = order.reduce((s, k) => s + (status[k] || 0), 0);
  return (
    <div
      className={`flex w-full overflow-hidden rounded-full bg-mes-surface-2 ${className}`}
      style={{ height }}
      role="img"
      aria-label={order.map((k) => `${meta[k].th} ${status[k] || 0}`).join(', ')}
    >
      {total > 0 && order.map((k) => {
        const v = status[k] || 0;
        if (!v) return null;
        return (
          <div key={k} style={{ width: `${(v / total) * 100}%`, background: `var(${meta[k].cssVar})` }} />
        );
      })}
    </div>
  );
}

// Donut of arbitrary segments: [{ value, cssVar }]
export function Donut({ segments, size = 64, thickness = 9, children }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--mes-surface-2)" strokeWidth={thickness} />
        {total > 0 && segments.map((seg, i) => {
          if (!seg.value) return null;
          const frac = seg.value / total;
          const el = (
            <circle
              key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={`var(${seg.cssVar})`} strokeWidth={thickness}
              strokeDasharray={`${frac * c} ${c}`} strokeDashoffset={-offset * c}
            />
          );
          offset += frac;
          return el;
        })}
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

// Vertical status-history timeline. items: [{ meta, title, sub, current }]
export function Timeline({ items }) {
  return (
    <div className="flex flex-col gap-0">
      {items.map((it, i) => (
        <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute left-[5px] top-4 bottom-0 w-px bg-mes-border" />
          )}
          <span
            className="mt-1.5 h-[11px] w-[11px] rounded-full shrink-0"
            style={{ background: `var(${it.meta.cssVar})`, outline: it.current ? `2px solid var(${it.meta.cssVar})` : 'none', outlineOffset: 2 }}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <b className="text-sm text-mes-text">{it.title}</b>
              {it.sub && <span className="text-xs text-mes-muted">{it.sub}</span>}
            </div>
            {it.by && <div className="text-xs text-mes-muted">{it.by}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
