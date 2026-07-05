// [MES] ImageLightbox — reusable fullscreen image viewer: pointer-events zoom/pan
// (wheel, pinch, double-tap), swipe navigate + swipe-down dismiss, blob download,
// per-image loading spinner, adjacent preload, and open/nav transitions.
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { Spinner } from './ui';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_NAV_PX = 60;
const SWIPE_DISMISS_PX = 100;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function ImageLightbox({ images, index, onClose, onNav, actions }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const pointers = useRef(new Map()); // pointerId -> { x, y }
  const gesture = useRef(null); // active gesture baseline
  const navDir = useRef(0); // -1 prev, 1 next, 0 initial

  const [tf, setTf] = useState({ scale: 1, x: 0, y: 0 });
  const [swipe, setSwipe] = useState({ x: 0, y: 0 }); // transient drag at scale 1
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [entered, setEntered] = useState(false);
  const lastTap = useRef(0);
  const lastTapPos = useRef({ x: 0, y: 0 });

  const tfRef = useRef(tf);
  tfRef.current = tf;

  const img = images[index];

  // Clamp a pan offset so the image edges never pull inside the viewport.
  const clampPan = useCallback((scale, x, y) => {
    const c = containerRef.current;
    const im = imgRef.current;
    if (!c || !im) return { x, y };
    const maxX = Math.max(0, (im.clientWidth * scale - c.clientWidth) / 2);
    const maxY = Math.max(0, (im.clientHeight * scale - c.clientHeight) / 2);
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, []);

  // Zoom to a target scale keeping point (cx,cy) — relative to container center — fixed.
  const zoomAround = useCallback((rawScale, cx, cy) => {
    const s0 = tfRef.current.scale;
    const s = clamp(rawScale, MIN_SCALE, MAX_SCALE);
    if (s === s0) return;
    let nx = cx - (cx - tfRef.current.x) * (s / s0);
    let ny = cy - (cy - tfRef.current.y) * (s / s0);
    if (s === MIN_SCALE) { nx = 0; ny = 0; }
    const p = clampPan(s, nx, ny);
    setTf({ scale: s, x: p.x, y: p.y });
  }, [clampPan]);

  const zoomBy = useCallback((factor) => {
    zoomAround(tfRef.current.scale * factor, 0, 0);
  }, [zoomAround]);

  const resetZoom = useCallback(() => setTf({ scale: 1, x: 0, y: 0 }), []);

  const requestClose = useCallback(() => {
    setEntered(false);
    window.setTimeout(() => onClose(), 180);
  }, [onClose]);

  const nav = useCallback((delta) => {
    navDir.current = delta;
    onNav(delta);
  }, [onNav]);

  // Reset zoom/loading state whenever the active image changes.
  useEffect(() => {
    setTf({ scale: 1, x: 0, y: 0 });
    setSwipe({ x: 0, y: 0 });
    setLoaded(false);
  }, [index]);

  // Open transition + body scroll-lock.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
    };
  }, []);

  // Keyboard: Esc / arrows / zoom keys.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') requestClose();
      else if (e.key === 'ArrowLeft') nav(-1);
      else if (e.key === 'ArrowRight') nav(1);
      else if (e.key === '+' || e.key === '=') zoomBy(1.5);
      else if (e.key === '-') zoomBy(1 / 1.5);
      else if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose, nav, zoomBy, resetZoom]);

  // Wheel zoom toward cursor (native listener so we can preventDefault).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      zoomAround(tfRef.current.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), cx, cy);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAround]);

  // Preload neighbours once the current image is ready.
  useEffect(() => {
    if (!loaded || images.length < 2) return;
    [index - 1, index + 1].forEach((i) => {
      const n = images[(i + images.length) % images.length];
      if (n?.src) {
        const pre = new Image();
        pre.src = n.src;
      }
    });
  }, [loaded, index, images]);

  const onPointerDown = (e) => {
    const el = containerRef.current;
    el.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const rect = el.getBoundingClientRect();
      gesture.current = {
        mode: 'pinch',
        startDist: distance(pts[0], pts[1]),
        startTf: { ...tfRef.current },
        cx: (pts[0].x + pts[1].x) / 2 - rect.left - rect.width / 2,
        cy: (pts[0].y + pts[1].y) / 2 - rect.top - rect.height / 2,
      };
      return;
    }

    // Single pointer — check for a double-tap first.
    const now = Date.now();
    const near = Math.hypot(e.clientX - lastTapPos.current.x, e.clientY - lastTapPos.current.y) < 30;
    if (now - lastTap.current < 300 && near) {
      lastTap.current = 0;
      const rect = el.getBoundingClientRect();
      if (tfRef.current.scale > 1) resetZoom();
      else zoomAround(DOUBLE_TAP_SCALE, e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2);
      gesture.current = null;
      return;
    }
    lastTap.current = now;
    lastTapPos.current = { x: e.clientX, y: e.clientY };

    gesture.current = {
      mode: 'single',
      startX: e.clientX,
      startY: e.clientY,
      startTf: { ...tfRef.current },
      axis: null,
      moved: false,
      lastDx: 0,
      lastDy: 0,
      onImage: !!imgRef.current && imgRef.current.contains(e.target),
    };
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;

    if (g.mode === 'pinch') {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const ratio = distance(pts[0], pts[1]) / g.startDist;
      const s = clamp(g.startTf.scale * ratio, MIN_SCALE, MAX_SCALE);
      const s0 = g.startTf.scale;
      let nx = g.cx - (g.cx - g.startTf.x) * (s / s0);
      let ny = g.cy - (g.cy - g.startTf.y) * (s / s0);
      if (s === MIN_SCALE) { nx = 0; ny = 0; }
      const p = clampPan(s, nx, ny);
      setTf({ scale: s, x: p.x, y: p.y });
      return;
    }

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    g.lastDx = dx;
    g.lastDy = dy;
    if (Math.hypot(dx, dy) > 8) g.moved = true;

    if (g.startTf.scale > 1) {
      const p = clampPan(g.startTf.scale, g.startTf.x + dx, g.startTf.y + dy);
      setTf({ scale: g.startTf.scale, x: p.x, y: p.y });
      return;
    }

    // scale === 1 → swipe navigate / dismiss
    if (!g.axis && Math.hypot(dx, dy) > 8) g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (g.axis === 'x') setSwipe({ x: dx, y: 0 });
    else if (g.axis === 'y') setSwipe({ x: 0, y: dy > 0 ? dy : 0 });
  };

  const endPointer = (e, cancelled) => {
    const el = containerRef.current;
    if (el && el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    const g = gesture.current;
    pointers.current.delete(e.pointerId);

    if (pointers.current.size === 1 && g && g.mode === 'pinch') {
      // A finger lifted mid-pinch — continue panning with the one left.
      const [pt] = [...pointers.current.values()];
      gesture.current = {
        mode: 'single', startX: pt.x, startY: pt.y,
        startTf: { ...tfRef.current }, axis: null, moved: true, lastDx: 0, lastDy: 0, onImage: true,
      };
      return;
    }

    if (pointers.current.size > 0) return;

    setDragging(false);
    setSwipe({ x: 0, y: 0 });
    gesture.current = null;
    if (cancelled || !g || g.mode !== 'single') return;

    if (g.startTf.scale <= 1) {
      if (g.axis === 'y' && g.lastDy > SWIPE_DISMISS_PX) requestClose();
      else if (g.axis === 'x' && Math.abs(g.lastDx) > SWIPE_NAV_PX) nav(g.lastDx < 0 ? 1 : -1);
      else if (!g.moved && !g.onImage) requestClose();
    }
  };

  if (!img) return null;

  const dismissFade = swipe.y > 0 ? Math.min(swipe.y / 400, 0.55) : 0;
  const slideClass = navDir.current === 1 ? 'mes-lb-slide-r' : navDir.current === -1 ? 'mes-lb-slide-l' : '';

  return createPortal(
    <div
      className="fixed inset-0 z-[45] flex flex-col bg-black/90 select-none"
      style={{ opacity: entered ? 1 - dismissFade : 0, transition: dragging ? 'none' : 'opacity 200ms ease-out' }}
    >
      <style>{`
        @keyframes mesLbSlideR { from { opacity: .4; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes mesLbSlideL { from { opacity: .4; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
        .mes-lb-slide-r { animation: mesLbSlideR .22s ease-out; }
        .mes-lb-slide-l { animation: mesLbSlideL .22s ease-out; }
      `}</style>

      <div
        className="flex h-full w-full flex-col"
        style={{ transform: entered ? 'scale(1)' : 'scale(0.97)', transition: 'transform 200ms ease-out' }}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-1.5 p-2 md:p-3">
          <span className="px-1 text-xs text-mes-muted tabular-nums">{index + 1} / {images.length}</span>
          <span className="grow" />
          {actions}
          <button
            className="mes-btn mes-btn-ghost !min-h-touch !min-w-touch !px-2"
            onClick={() => zoomBy(1 / 1.5)}
            disabled={tf.scale <= MIN_SCALE}
            aria-label="ย่อ"
          >
            <Icon name="zoom-out" size={18} />
          </button>
          <button
            className="mes-btn mes-btn-ghost !min-h-touch !px-2 tabular-nums text-xs max-md:!hidden"
            onClick={resetZoom}
            disabled={tf.scale === MIN_SCALE}
            aria-label="รีเซ็ตการซูม"
          >
            {Math.round(tf.scale * 100)}%
          </button>
          <button
            className="mes-btn mes-btn-ghost !min-h-touch !min-w-touch !px-2"
            onClick={() => zoomBy(1.5)}
            disabled={tf.scale >= MAX_SCALE}
            aria-label="ขยาย"
          >
            <Icon name="zoom-in" size={18} />
          </button>
          <button
            className="mes-btn mes-btn-ghost !min-h-touch !min-w-touch !px-2"
            onClick={() => downloadImage(img.src, index)}
            aria-label="ดาวน์โหลดรูป"
          >
            <Icon name="download" size={18} />
          </button>
          <button
            className="mes-btn mes-btn-ghost !min-h-touch !min-w-touch !px-2"
            onClick={requestClose}
            aria-label="ปิด"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Stage */}
        <div
          ref={containerRef}
          className="relative flex min-h-0 grow items-center justify-center overflow-hidden"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endPointer(e, false)}
          onPointerCancel={(e) => endPointer(e, true)}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          )}

          <div key={index} className={`flex h-full w-full items-center justify-center ${slideClass}`}>
            <img
              ref={imgRef}
              src={img.src}
              alt={img.alt}
              draggable={false}
              onLoad={() => setLoaded(true)}
              className="max-h-full max-w-full object-contain"
              style={{
                transform: `translate(${tf.x + swipe.x}px, ${tf.y + swipe.y}px) scale(${tf.scale})`,
                transition: dragging ? 'none' : 'transform 200ms ease-out',
                cursor: tf.scale > 1 ? 'grab' : 'default',
                visibility: loaded ? 'visible' : 'hidden',
                willChange: 'transform',
              }}
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-2 z-10 flex min-h-touch min-w-touch items-center justify-center rounded-full bg-mes-surface/70 text-mes-text"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => nav(-1)}
                aria-label="รูปก่อนหน้า"
              >
                <Icon name="chevron-left" size={22} />
              </button>
              <button
                className="absolute right-2 z-10 flex min-h-touch min-w-touch items-center justify-center rounded-full bg-mes-surface/70 text-mes-text"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => nav(1)}
                aria-label="รูปถัดไป"
              >
                <Icon name="chevron-right" size={22} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Fetch the image as a blob and trigger a download; fall back to a new tab on failure.
// Cross-origin sources (e.g. S3 without CORS) can't be fetched as blobs, and a popup
// opened after `await` gets blocked — so open the tab synchronously while the click
// gesture is still valid.
async function downloadImage(src, index) {
  if (new URL(src, window.location.href).origin !== window.location.origin) {
    window.open(src, '_blank', 'noopener');
    return;
  }
  const extMatch = /\.([a-zA-Z0-9]{3,4})(?:\?|$)/.exec(src);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const name = `site-photo-${index + 1}.${ext}`;
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    window.open(src, '_blank', 'noopener');
  }
}
