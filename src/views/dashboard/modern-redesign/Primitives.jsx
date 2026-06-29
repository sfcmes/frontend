import React, { useMemo } from 'react';
import { ICON_PATHS } from './utils';

export function Icon({ name, size = 20, stroke = 1.75, style, className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', flex: 'none', ...style }}
    >
      <path d={ICON_PATHS[name] || ''} />
    </svg>
  );
}

export function Donut({ segments, size = 64, thickness = 9, track = '#E7ECF2', children, gap = 0 }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const len = Math.max(0, frac * c - gap);
          const el = (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += frac * c;
          return el;
        })}
      </svg>
      {children != null && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', lineHeight: 1,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function Sparkline({ points, color = '#5D87FF', width = 96, height = 30 }) {
  const max = Math.max(...points, 1), min = Math.min(...points, 0);
  const span = max - min || 1;
  const step = width / (points.length - 1 || 1);
  const coords = points.map((p, i) => [i * step, height - ((p - min) / span) * (height - 4) - 2]);
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const gid = useMemo(() => 'sg' + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.4" fill={color} />
    </svg>
  );
}

export function PipelineBar({ status, order, meta, height = 6 }) {
  const total = order.reduce((a, k) => a + (status[k] || 0), 0) || 1;
  return (
    <div style={{ display: 'flex', width: '100%', height, borderRadius: 2, overflow: 'hidden', background: '#E7ECF2' }}>
      {order.map((k) => {
        const v = status[k] || 0;
        if (!v) return null;
        return (
          <div
            key={k}
            title={`${meta[k].th} · ${v}`}
            style={{ width: `${(v / total) * 100}%`, background: meta[k].color }}
          />
        );
      })}
    </div>
  );
}

function buildQR(value, n) {
  let a = 2166136261;
  for (let i = 0; i < value.length; i++) { a ^= value.charCodeAt(i); a = Math.imul(a, 16777619); }
  const rand = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const g = Array.from({ length: n }, () => Array(n).fill(false));
  const reserved = Array.from({ length: n }, () => Array(n).fill(false));
  const finder = (r, c) => {
    for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
      const rr = r + i, cc = c + j;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
      reserved[rr][cc] = true;
      const ring = i >= 0 && i <= 6 && j >= 0 && j <= 6 && (i === 0 || i === 6 || j === 0 || j === 6);
      const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      g[rr][cc] = ring || core;
    }
  };
  finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
  for (let i = 8; i < n - 8; i++) { const on = i % 2 === 0; g[6][i] = on; g[i][6] = on; reserved[6][i] = true; reserved[i][6] = true; }
  const ar = n - 9, ac = n - 9;
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
    reserved[ar + i][ac + j] = true;
    g[ar + i][ac + j] = Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0);
  }
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!reserved[r][c]) g[r][c] = rand() < 0.47;
  return g;
}

export function QRCode({ value, size = 132, modules = 27, fg = '#11202E' }) {
  const grid = useMemo(() => buildQR(value || 'SFC', modules), [value, modules]);
  const cell = size / modules;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', borderRadius: 4 }} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#fff" />
      {grid.map((row, r) => row.map((on, c) => on ? (
        <rect key={r + '-' + c}
          x={(c * cell).toFixed(2)} y={(r * cell).toFixed(2)}
          width={cell.toFixed(2)} height={cell.toFixed(2)} fill={fg} />
      ) : null))}
    </svg>
  );
}
