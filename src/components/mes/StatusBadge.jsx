// [MES] StatusBadge — the ONLY component (with the chart primitives) allowed
// to render status colors. Variants: pill (default), dot, row (row-highlight style).
import { resolveComponentStatus, resolvePOStatus, resolveSemStatus, statusColor } from './status-meta';

const RESOLVERS = { component: resolveComponentStatus, po: resolvePOStatus, sem: resolveSemStatus };

export function StatusBadge({
  status, kind = 'component', variant = 'pill', size = 'md', className = '',
  onClick, 'aria-label': ariaLabel, children,
}) {
  const meta = (RESOLVERS[kind] || resolveComponentStatus)(status);
  const color = statusColor(meta);
  const dashed = kind === 'po' && status === 'draft';

  // Tile: status-colored piece cell for dense grids (dashboard drawer). Whole tile is the button.
  if (variant === 'tile') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        title={meta.th}
        className={`flex min-h-touch min-w-0 items-center justify-center rounded-sm px-1 text-sm font-semibold tabular-nums ${className}`}
        style={{
          color,
          background: `color-mix(in srgb, ${color} 13%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
        }}
      >
        <span className="truncate">{children}</span>
      </button>
    );
  }

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-mes-text text-sm">{meta.th}</span>
      </span>
    );
  }

  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${pad} ${className}`}
      style={{
        color,
        background: `color-mix(in srgb, ${color} 13%, transparent)`,
        border: `1px ${dashed ? 'dashed' : 'solid'} color-mix(in srgb, ${color} 45%, transparent)`,
      }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {meta.th}
    </span>
  );
}

// Row-highlight helper: returns an inline style for status-tinted table rows.
// eslint-disable-next-line react-refresh/only-export-components
export function statusRowStyle(status, kind = 'component') {
  const meta = (RESOLVERS[kind] || resolveComponentStatus)(status);
  return { boxShadow: `inset 3px 0 0 var(${meta.cssVar})` };
}
