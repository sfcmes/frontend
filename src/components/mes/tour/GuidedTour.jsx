// [MES] GuidedTour — interactive page tour: dims the page with four shield divs,
// leaves an interactive spotlight hole over the data-tour target, and shows a
// Thai walkthrough card (floating tooltip at md+, bottom sheet below).
// Page-agnostic: pair with useTour.js; pages supply steps + a state object.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon';

const PAD = 8; // spotlight padding around the target box
const CARD_W = 320; // md+ tooltip card width
const CARD_EST_H = 230; // rough card height for above/below placement

// A data-tour key can match two nodes (mobile card + md+ table render) —
// pick the one actually visible at the current breakpoint.
function findTarget(key) {
  const nodes = document.querySelectorAll(`[data-tour="${key}"]`);
  for (const el of nodes) {
    if (el.offsetParent !== null) return el;
  }
  return null;
}

export function GuidedTour({ open, step, stepIndex, total, isLast, state, onNext, onBack, onClose }) {
  const [box, setBox] = useState(null); // target rect incl. padding, in viewport coords
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia('(min-width: 768px)').matches,
  );
  const rafRef = useRef(0);

  // Track breakpoint (card switches tooltip ↔ bottom sheet).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Measure the target; keep measuring on scroll/resize (smooth scrollIntoView
  // moves the box for several frames).
  useLayoutEffect(() => {
    if (!open || !step) return undefined;
    if (!step.target) {
      setBox(null);
      return undefined;
    }
    const el = findTarget(step.target);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });

    const measure = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const t = findTarget(step.target);
        if (!t) {
          setBox(null);
          return;
        }
        const r = t.getBoundingClientRect();
        setBox({
          top: r.top - PAD,
          left: r.left - PAD,
          width: r.width + PAD * 2,
          height: r.height + PAD * 2,
        });
      });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, step]);

  // Interactive steps: advance once the page state proves the action happened
  // (works even if the user acted before reaching this step).
  useEffect(() => {
    if (!open || !step?.waitFor) return undefined;
    if (!step.waitFor(state)) return undefined;
    const t = setTimeout(onNext, 600); // let the user see what changed
    return () => clearTimeout(t);
  }, [open, step, state, onNext]);

  // Target declared but never rendered (e.g. gated markup) → skip silently.
  // 400ms grace covers render + scroll settling.
  useEffect(() => {
    if (!open || !step?.target) return undefined;
    const t = setTimeout(() => {
      if (!findTarget(step.target)) onNext();
    }, 400);
    return () => clearTimeout(t);
  }, [open, step, onNext]);

  // Escape dismisses (same convention as Modal).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !step) return null;

  const dim = { position: 'fixed', background: 'var(--tour-dim)', zIndex: 70 };
  const shields = box
    ? [
        { ...dim, top: 0, left: 0, right: 0, height: Math.max(box.top, 0) },
        { ...dim, top: box.top, left: 0, width: Math.max(box.left, 0), height: box.height },
        { ...dim, top: box.top, left: box.left + box.width, right: 0, height: box.height },
        { ...dim, top: box.top + box.height, left: 0, right: 0, bottom: 0 },
      ]
    : [{ ...dim, top: 0, left: 0, right: 0, bottom: 0 }];

  // md+ tooltip placement: below the target if it fits, else above; clamped
  // horizontally. Base (<md) ignores this — the card is a fixed bottom sheet.
  let cardStyle;
  if (isDesktop) {
    if (!box) {
      cardStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: CARD_W };
    } else {
      const below = box.top + box.height + 12;
      const top = below + CARD_EST_H < window.innerHeight ? below : Math.max(box.top - CARD_EST_H - 12, 8);
      const left = Math.min(Math.max(box.left, 8), window.innerWidth - CARD_W - 8);
      cardStyle = { top, left, width: CARD_W };
    }
  }

  const waiting = step.waitFor && !step.waitFor(state);

  return createPortal(
    <>
      {shields.map((s, i) => (
        <div key={i} style={s} aria-hidden="true" />
      ))}
      {box && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[70] rounded-md border-2 border-mes-accent transition-all duration-200"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
        />
      )}
      <div
        role="dialog"
        aria-label={step.title}
        className="fixed z-[71] border border-mes-border bg-mes-surface p-4 shadow-overlay inset-x-0 bottom-0 rounded-t-lg md:inset-auto md:bottom-auto md:rounded-lg"
        style={cardStyle}
      >
        <div className="text-xs text-mes-muted tabular-nums">
          ขั้นตอน {stepIndex + 1}/{total}
        </div>
        <div className="mt-1 text-sm font-semibold text-mes-text">{step.title}</div>
        <p className="mt-1 text-sm text-mes-muted">{step.body}</p>
        {waiting && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-mes-accent">
            <Icon name="point" size={14} /> ลองทำตามขั้นตอนนี้เพื่อไปต่อ
          </div>
        )}
        <div className="mt-4 flex items-center gap-2">
          <button type="button" className="mes-btn mes-btn-ghost" onClick={onClose}>
            ข้าม
          </button>
          <div className="ml-auto flex gap-2">
            {stepIndex > 0 && (
              <button type="button" className="mes-btn mes-btn-ghost" onClick={onBack}>
                ย้อนกลับ
              </button>
            )}
            {!step.waitFor && (
              <button type="button" className="mes-btn mes-btn-primary" onClick={onNext}>
                {isLast ? 'เสร็จสิ้น' : step.nextLabel || 'ถัดไป'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
