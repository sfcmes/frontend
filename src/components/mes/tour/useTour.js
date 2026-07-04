// [MES] useTour — guided-tour state: walks `when`-eligible steps in order,
// auto-starts once per browser (localStorage seen flag), exposes start/next/back/close.
// Rendering (spotlight, card, waitFor auto-advance) lives in GuidedTour.jsx.
import { useCallback, useEffect, useMemo, useState } from 'react';

// localStorage can throw (Safari private mode, storage disabled, quota) — guard
// both access paths so a failing write never strands the tour overlay open.
function readSeen(storageKey) {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeSeen(storageKey) {
  try {
    localStorage.setItem(storageKey, '1');
  } catch {
    // Swallow — inability to persist the seen flag must not block dismissal.
  }
}

export function useTour({ storageKey, steps, state, autoStartDelay = 500 }) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Steps whose `when` gate fails (wrong role, no data) drop out silently.
  // Recomputed as page state changes — gated steps ahead of the current index
  // can appear/disappear; steps behind it are stable in practice (they gate
  // on state that only moves forward within one tour run).
  const eligible = useMemo(
    () => steps.filter((s) => !s.when || s.when(state)),
    [steps, state],
  );

  // Auto-start once per browser on first visit (delay lets layout settle).
  useEffect(() => {
    if (readSeen(storageKey)) return undefined;
    const t = setTimeout(() => setOpen(true), autoStartDelay);
    return () => clearTimeout(t);
  }, [storageKey, autoStartDelay]);

  const close = useCallback(() => {
    // Dismissing counts as seen — never auto-nag again; ❓ replays on demand.
    // writeSeen swallows storage failures so the overlay always closes.
    writeSeen(storageKey);
    setOpen(false);
    setStepIndex(0);
  }, [storageKey]);

  const next = useCallback(() => {
    if (stepIndex + 1 >= eligible.length) close();
    else setStepIndex(stepIndex + 1);
  }, [stepIndex, eligible.length, close]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setOpen(true);
  }, []);

  return {
    open,
    step: open ? eligible[stepIndex] || null : null,
    stepIndex,
    total: eligible.length,
    isLast: stepIndex >= eligible.length - 1,
    start,
    next,
    back,
    close,
  };
}
