import React, { useRef, useCallback, useEffect, useState } from 'react';

const STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:72px;z-index:9999;width:280px;
    max-height:calc(100vh - 88px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.88);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.22);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none;border-bottom:.5px solid rgba(0,0,0,.07)}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px;line-height:22px;
    display:flex;align-items:center;justify-content:center}
  .twk-x:hover{background:rgba(0,0,0,.07);color:#29261b}
  .twk-body{padding:8px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:6px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:8px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;cursor:pointer;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}
  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none;cursor:pointer}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;
    border-radius:50%;background:#fff;border:.5px solid rgba(0,0,0,.12);
    box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:pointer}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2)}
  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:pointer;padding:4px 6px;line-height:1.2}
  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:40px;
    padding:0;border:0;border-radius:7px;overflow:hidden;cursor:pointer;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s,box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 2px rgba(0,0,0,.8),0 2px 6px rgba(0,0,0,.15)}
  .twk-chip svg{position:absolute;top:5px;left:5px;width:12px;height:12px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

function styleTag() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('twk-style')) return;
  const s = document.createElement('style');
  s.id = 'twk-style';
  s.textContent = STYLE;
  document.head.appendChild(s);
}

/* ---- Primitives ---- */

function TweakSection({ label }) {
  return <div className="twk-sect">{label}</div>;
}

function TweakRow({ label, value, children }) {
  return (
    <div className="twk-row">
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input
        type="range" className="twk-slider"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const maxLen = opts.reduce((m, o) => Math.max(m, String(o.label).length), 0);
  const fits = maxLen <= ({ 2: 16, 3: 10 }[opts.length] ?? 0);

  if (!fits) {
    return <TweakSelect label={label} value={value} options={opts} onChange={onChange} />;
  }

  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const i = Math.floor(((clientX - r.left - 2) / (r.width - 4)) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (trackRef.current) {
        const v = segAt(ev.clientX);
        if (v !== valueRef.current) onChange(v);
      }
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
        className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb" style={{
          left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
          width: `calc((100% - 4px) / ${n})`,
        }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function isLight(hex) {
  const h = String(hex).replace('#', '').padEnd(6, '0');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

function Check({ light }) {
  return (
    <svg viewBox="0 0 14 14" style={{ position: 'absolute', top: 5, left: 5, width: 12, height: 12, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.3))' }}>
      <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
        stroke={light ? 'rgba(0,0,0,.78)' : '#fff'} />
    </svg>
  );
}

function TweakColor({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((color, i) => {
          const on = color.toLowerCase() === String(value).toLowerCase();
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
              aria-checked={on} data-on={on ? '1' : '0'}
              title={color} style={{ background: color }}
              onClick={() => onChange(color)}>
              {on && <Check light={isLight(color)} />}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

/* ---- Main panel ---- */

const ACCENT_OPTIONS = ['#3D5A80', '#5D87FF', '#2E9E5B', '#E08A00'];

const VIZ_OPTIONS = [
  { value: 'bar', label: 'แท่ง' },
  { value: 'donut', label: 'โดนัท' },
  { value: 'number', label: 'ตัวเลข' },
  { value: 'spark', label: 'กราฟเส้น' },
];

const BG_OPTIONS = [
  { value: 'sky', label: 'Sky' },
  { value: 'flat', label: 'Flat' },
];

export function TweaksPanel({ tweaks, onChange, open, onClose }) {
  const panelRef = useRef(null);
  const offsetRef = useRef({ right: 16, bottom: 72 });
  const PAD = 16;

  useEffect(() => { styleTag(); }, []);

  const clamp = useCallback(() => {
    const p = panelRef.current;
    if (!p) return;
    const maxR = Math.max(PAD, window.innerWidth - p.offsetWidth - PAD);
    const maxB = Math.max(PAD, window.innerHeight - p.offsetHeight - PAD);
    offsetRef.current = {
      right: Math.min(maxR, Math.max(PAD, offsetRef.current.right)),
      bottom: Math.min(maxB, Math.max(PAD, offsetRef.current.bottom)),
    };
    p.style.right = offsetRef.current.right + 'px';
    p.style.bottom = offsetRef.current.bottom + 'px';
  }, []);

  useEffect(() => {
    if (!open) return;
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [open, clamp]);

  const onDragStart = (e) => {
    const p = panelRef.current;
    if (!p) return;
    const r = p.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startR = window.innerWidth - r.right;
    const startB = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        right: startR - (ev.clientX - sx),
        bottom: startB - (ev.clientY - sy),
      };
      clamp();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;

  const set = (key, val) => onChange({ ...tweaks, [key]: val });

  return (
    <div ref={panelRef} className="twk-panel"
      style={{ right: offsetRef.current.right, bottom: offsetRef.current.bottom }}>
      <div className="twk-hd" onMouseDown={onDragStart}>
        <b>Tweaks</b>
        <button className="twk-x" onClick={onClose} onMouseDown={(e) => e.stopPropagation()}>✕</button>
      </div>
      <div className="twk-body">
        <TweakSection label="การ์ดสถิติ" />
        <TweakRadio
          label="รูปแบบสถิติ" value={tweaks.viz}
          options={VIZ_OPTIONS}
          onChange={(v) => set('viz', v)}
        />

        <TweakSection label="ธีม & สี" />
        <TweakColor
          label="สีหลัก (Accent)" value={tweaks.accent}
          options={ACCENT_OPTIONS}
          onChange={(v) => set('accent', v)}
        />
        <TweakRadio
          label="พื้นหลังส่วนหัว" value={tweaks.bg}
          options={BG_OPTIONS}
          onChange={(v) => set('bg', v)}
        />

        <TweakSection label="ตาราง" />
        <TweakSlider
          label="ความหนาแน่นแถว" value={tweaks.density}
          min={1} max={5} step={1}
          onChange={(v) => set('density', v)}
        />
      </div>
    </div>
  );
}
