# Material Requirements Guided Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An interactive guided tour on `/forms/form-material-requirements` that auto-starts on first visit, spotlights each part of the page step-by-step in Thai, waits for the user to actually perform key actions (select a project, run the calculation), and can be replayed via a ❓ header button.

**Architecture:** A generic, page-agnostic tour system in `src/components/mes/tour/` (a `useTour` state hook + a `GuidedTour` renderer that dims the page with four "shield" divs, leaving an interactive spotlight hole over the target). The material requirements page supplies a declarative `TOUR_STEPS` array; steps are gated by `when(state)` (role/data gates → silently skipped) and held by `waitFor(state)` (tour advances only when the page state proves the user did the action).

**Tech Stack:** React 18, Tailwind CSS v3 + `src/styles/tokens.css` tokens, `createPortal`, `localStorage`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-04-material-requirements-tour-design.md` (approved).

## Global Constraints

- **No hex/rgba color values outside `src/styles/tokens.css`** (ADR-0006 rule 1). The tour dim color is a new token `--tour-dim`; the spotlight ring uses `var(--mes-accent)`.
- **No status colors in tour UI** (ADR-0006 rule 2).
- **Every new MES component file starts with a `// [MES] Name — what it does` header comment** (ADR-0006 rule 5).
- **All user-facing strings are Thai**; identifiers are English (frontend CLAUDE.md).
- **Mobile-first:** below `md` the tour card is a bottom sheet with full-width ≥48px buttons; at `md+` it is a floating tooltip card. No horizontal page scroll at any width.
- **Frontend uses ES modules** (`import`/`export`).
- **localStorage key:** `mes-tour-material-requirements-v1` — exact string, used in Task 4.
- **z-index layering:** existing `Modal` overlay is `z-50`, toast is `z-[60]`. Tour shields/ring use `z-[70]`, tour card `z-[71]`.
- **No test runner exists in this repo** (`npm test` is not configured). Every task verifies with `npm run lint` (must pass with no new errors) and the final task verifies end-to-end in the browser. Do not add a test framework.
- **Git:** work on branch `re-design` (verify with `git branch --show-current`). Commit after every task; stage only the task's files. Never commit if `npm run build` fails.

---

### Task 1: Tour tokens + help icon

**Files:**
- Modify: `src/styles/tokens.css:60-62` (add `--tour-dim` next to the elevation token)
- Modify: `src/components/mes/Icon.jsx:55` (add `help-circle` to `ICON_PATHS`, before the closing `};`)

**Interfaces:**
- Produces: CSS var `--tour-dim` (translucent page-dim color, consumed by Task 3), icon name `'help-circle'` (consumed by Task 4's header button).

- [ ] **Step 1: Add the `--tour-dim` token**

In `src/styles/tokens.css`, the `:root` block currently ends with:

```css
  /* Elevation (overlays only — surfaces elevate via surface steps + border) */
  --shadow-overlay: 0 16px 48px rgba(4, 8, 20, 0.6);
}
```

Change to:

```css
  /* Elevation (overlays only — surfaces elevate via surface steps + border) */
  --shadow-overlay: 0 16px 48px rgba(4, 8, 20, 0.6);

  /* Guided tour page-dim (shields around the spotlight hole) */
  --tour-dim: rgba(4, 8, 20, 0.72);
}
```

- [ ] **Step 2: Add the `help-circle` icon path**

In `src/components/mes/Icon.jsx`, the `ICON_PATHS` object ends with:

```js
  'edit': 'M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1 M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z M16 5l3 3',
};
```

Change to (Tabler `help-circle` path, same 24×24 stroke style as the rest):

```js
  'edit': 'M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1 M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z M16 5l3 3',
  'help-circle': 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 17l0 .01 M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4',
};
```

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: exits 0 with no new errors (pre-existing warnings, if any, are unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css src/components/mes/Icon.jsx
git commit -m "feat(tour): add --tour-dim token and help-circle icon"
```

---

### Task 2: `useTour` hook

**Files:**
- Create: `src/components/mes/tour/useTour.js`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `useTour({ storageKey, steps, state, autoStartDelay = 500 })` returning `{ open, step, stepIndex, total, isLast, start, next, back, close }`.
  - `steps`: array of step objects `{ id, target, title, body, nextLabel?, when?, waitFor? }` — `when(state) => boolean` gates eligibility, `waitFor(state) => boolean` marks an interactive step (Task 3 consumes it).
  - `state`: arbitrary object passed to `when`/`waitFor`.
  - `step` is the current **eligible** step (steps whose `when` is false are filtered out); `null` when closed.
  - `start()` (re)opens at step 0; `next()` advances or finishes; `back()` goes to the previous eligible step; `close()` dismisses. Finishing or dismissing writes the seen-flag; auto-start fires once per browser when the flag is absent.

- [ ] **Step 1: Write the hook**

Create `src/components/mes/tour/useTour.js` with exactly:

```js
// [MES] useTour — guided-tour state: walks `when`-eligible steps in order,
// auto-starts once per browser (localStorage seen flag), exposes start/next/back/close.
// Rendering (spotlight, card, waitFor auto-advance) lives in GuidedTour.jsx.
import { useCallback, useEffect, useMemo, useState } from 'react';

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
    if (localStorage.getItem(storageKey)) return undefined;
    const t = setTimeout(() => setOpen(true), autoStartDelay);
    return () => clearTimeout(t);
  }, [storageKey, autoStartDelay]);

  const close = useCallback(() => {
    // Dismissing counts as seen — never auto-nag again; ❓ replays on demand.
    localStorage.setItem(storageKey, '1');
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
```

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: exits 0; the new file produces no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/mes/tour/useTour.js
git commit -m "feat(tour): useTour hook — eligible-step state + first-visit auto-start"
```

---

### Task 3: `GuidedTour` renderer

**Files:**
- Create: `src/components/mes/tour/GuidedTour.jsx`

**Interfaces:**
- Consumes: CSS var `--tour-dim` (Task 1); step shape from Task 2 (`{ target, title, body, nextLabel?, waitFor? }` — `when` is already applied by the hook, so this component never sees ineligible steps).
- Produces: `<GuidedTour open step stepIndex total isLast state onNext onBack onClose />` — all props map 1:1 onto `useTour`'s return values plus the page's `state` object. Targets are located by `data-tour="<key>"` DOM attributes; when a key matches several nodes (mobile + desktop renders) the **visible** one wins.

Behavior contract (from spec):
- Dim everything except the target ("spotlight") using four fixed shield divs — the hole stays fully interactive, everything else swallows clicks.
- `step.target == null` → no spotlight, centered card (md+) / bottom sheet (base).
- Steps with `waitFor`: hide the next button, show a "do it" hint, auto-advance ~600ms after `waitFor(state)` turns true.
- Target declared but not found in the DOM after a 400ms grace → `onNext()` (silent skip).
- Re-measure on scroll/resize; `scrollIntoView({ block: 'center' })` on step entry; Escape closes.

- [ ] **Step 1: Write the component**

Create `src/components/mes/tour/GuidedTour.jsx` with exactly:

```jsx
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
        // eslint-disable-next-line react/no-array-index-key
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
```

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: exits 0; the new file produces no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/mes/tour/GuidedTour.jsx
git commit -m "feat(tour): GuidedTour renderer — spotlight shields + responsive step card"
```

---

### Task 4: Wire the tour into the material requirements page

**Files:**
- Modify: `src/views/forms/FormMaterialRequirements.js` (imports at 4-9; TOUR_STEPS after line 19; hook wiring near line 68; `data-tour` attributes at lines 230, 233, 271, 294, 351, 357, 407, 428, 484; `<GuidedTour />` render before `{toastNode}` at line 576)

**Interfaces:**
- Consumes: `useTour` (Task 2), `GuidedTour` (Task 3), icon `'help-circle'` (Task 1).
- Produces: nothing consumed by later tasks (Task 5 verifies in the browser).

`data-tour` key map (must match `TOUR_STEPS` targets exactly):

| key | element |
|---|---|
| `project-picker` | picker wrapper div (line 233) |
| `calc-button` | คำนวณความต้องการ button (line 271) |
| `results-table` | mobile cards container (line 351) **and** md+ table container (line 407) |
| `first-row` | first material card (mobile map, line 357) **and** first md+ table row (line 428) |
| `warnings-banner` | warnings div (line 294) |
| `generate-bar` | buyer generate bar div (line 484) |
| `help-button` | new ❓ button in `CardHeader`'s `right` slot |

- [ ] **Step 1: Add imports**

Line 4-9 currently:

```js
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import { fetchProjects, fetchMaterialRequirements, generateMaterialPO } from 'src/utils/api';
import { Icon } from 'src/components/mes/Icon';
import { Modal, EmptyState, Spinner, useToast, CardHeader } from 'src/components/mes/ui';
```

Add after the `ui` import:

```js
import { GuidedTour } from 'src/components/mes/tour/GuidedTour';
import { useTour } from 'src/components/mes/tour/useTour';
```

- [ ] **Step 2: Add the TOUR_STEPS module constant**

Insert after the `fmt` helper (line 19), before `ComponentBreakdown`:

```js
// Guided tour — GuidedTour walks these top-to-bottom. `when` gates a step by
// page state (false → silently skipped), `waitFor` holds the step until the
// user really performs the action. Targets = data-tour attributes below.
const TOUR_STORAGE_KEY = 'mes-tour-material-requirements-v1';
const TOUR_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'ยินดีต้อนรับสู่หน้าคำนวณวัสดุ',
    body: 'หน้านี้ช่วยคำนวณว่าต้องสั่งวัสดุอะไรเพิ่มเท่าไร จากชิ้นงานทั้งหมดในโครงการที่เลือก มาดูวิธีใช้งานทีละขั้นกัน',
    nextLabel: 'เริ่มทัวร์',
  },
  {
    id: 'no-projects',
    target: null,
    when: (s) => !s.projectsLoading && !s.hasProjects,
    title: 'ยังไม่มีโครงการในระบบ',
    body: 'ต้องมีโครงการอย่างน้อย 1 โครงการก่อนจึงจะคำนวณได้ — ไปที่เมนูโครงการเพื่อสร้างโครงการ แล้วค่อยกลับมาที่หน้านี้',
    nextLabel: 'จบทัวร์',
  },
  {
    id: 'pick-project',
    target: 'project-picker',
    when: (s) => s.hasProjects,
    waitFor: (s) => s.selectedCount > 0,
    title: 'เลือกโครงการ',
    body: 'ติ๊กเลือกโครงการที่ต้องการคำนวณ เลือกได้หลายโครงการพร้อมกัน — ลองเลือกดูเลย',
  },
  {
    id: 'calculate',
    target: 'calc-button',
    when: (s) => s.hasProjects,
    waitFor: (s) => s.hasResult,
    title: 'กดคำนวณ',
    body: 'กดปุ่มนี้เพื่อให้ระบบคำนวณวัสดุที่ต้องใช้จากชิ้นงานทุกตัวในโครงการที่เลือก',
  },
  {
    id: 'results',
    target: 'results-table',
    when: (s) => s.hasMaterials,
    title: 'ตารางความต้องการวัสดุ',
    body: 'แต่ละแถวคือวัสดุ 1 รายการ: ต้องใช้ (รวมเผื่อเสีย), ปัดขึ้น, สั่งแล้ว/ค้างรับ และคอลัมน์สำคัญ "ต้องสั่งเพิ่ม" คือยอดที่ยังขาด',
  },
  {
    id: 'breakdown',
    target: 'first-row',
    when: (s) => s.hasMaterials,
    title: 'ดูที่มาของตัวเลข',
    body: 'กดที่แถววัสดุเพื่อดูรายชิ้นงาน: ค่าที่ใช้ × ตัวคูณ × เผื่อเสีย% ของแต่ละชิ้น — ตรวจสอบย้อนกลับได้ทุกตัวเลข',
  },
  {
    id: 'warnings',
    target: 'warnings-banner',
    when: (s) => s.hasWarnings,
    title: 'คำเตือนในการคำนวณ',
    body: 'ชิ้นงานที่คำนวณไม่ได้ (ไม่มีข้อมูลขนาด หรือยังไม่มีสูตร) จะแสดงที่นี่ — ไปเพิ่มข้อมูลที่หน้าวัสดุและสูตร แล้วคำนวณใหม่',
  },
  {
    id: 'generate',
    target: 'generate-bar',
    when: (s) => s.isBuyer && s.hasMaterials,
    title: 'สร้างใบสั่งซื้อ (ร่าง)',
    body: 'ติ๊กเลือกวัสดุที่จะสั่ง แล้วกดปุ่มนี้ — ระบบจะสร้าง PO สถานะร่าง แยกตามผู้ขายให้อัตโนมัติ',
  },
  {
    id: 'finish',
    target: 'help-button',
    title: 'จบทัวร์แล้ว',
    body: 'อยากดูทัวร์นี้อีกครั้ง กดปุ่มนี้ได้ตลอดเวลา',
  },
];
```

- [ ] **Step 3: Wire the hook inside the component**

After `const selectedCount = selectedMaterialIds.size;` (line 226), add:

```js
  // ---- guided tour ----
  const tourState = useMemo(
    () => ({
      projectsLoading,
      hasProjects: projects.length > 0,
      selectedCount: selectedProjectIds.length,
      hasResult: !!result,
      hasMaterials: materials.length > 0,
      hasWarnings,
      isBuyer,
    }),
    [projectsLoading, projects.length, selectedProjectIds.length, result, materials.length, hasWarnings, isBuyer],
  );
  const tour = useTour({ storageKey: TOUR_STORAGE_KEY, steps: TOUR_STEPS, state: tourState });
```

- [ ] **Step 4: Add the ❓ replay button to the header**

Line 230 currently:

```jsx
      <CardHeader title="คำนวณความต้องการวัสดุ" sub="เลือกโครงการเพื่อคำนวณยอดวัสดุที่ต้องสั่งซื้อเพิ่ม" />
```

Change to:

```jsx
      <CardHeader
        title="คำนวณความต้องการวัสดุ"
        sub="เลือกโครงการเพื่อคำนวณยอดวัสดุที่ต้องสั่งซื้อเพิ่ม"
        right={
          <button
            type="button"
            data-tour="help-button"
            className="mes-btn mes-btn-ghost !px-3"
            onClick={tour.start}
            aria-label="วิธีใช้งาน"
            title="วิธีใช้งาน"
          >
            <Icon name="help-circle" size={18} />
          </button>
        }
      />
```

- [ ] **Step 5: Tag the tour targets with `data-tour`**

Five attribute-only edits (no structural changes):

a. Picker wrapper (line 233): `<div className="border-b border-mes-border p-3 md:p-5">` → `<div data-tour="project-picker" className="border-b border-mes-border p-3 md:p-5">`

b. Calculate button (line 271): add `data-tour="calc-button"` to the `<button ... onClick={onCalculate}>`.

c. Warnings banner (line 294): `<div className="mb-4 rounded-md border border-mes-accent/40 bg-mes-surface-2 p-3 md:p-4">` → add `data-tour="warnings-banner"`.

d. Results containers — both renders get `data-tour="results-table"`:
   - mobile cards div (line 351): `<div data-tour="results-table" className="flex flex-col gap-2 md:hidden">`
   - md+ wrapper div (line 407): `<div data-tour="results-table" className="hidden md:block">`

e. Generate bar (line 484): add `data-tour="generate-bar"` to the `<div className="mt-4 flex flex-wrap items-center ...">`.

- [ ] **Step 6: Tag the first material row (both renders)**

The `first-row` target needs the map index. Mobile render (line 352): change `{materials.map((m) => {` to `{materials.map((m, idx) => {` and the card div (line 357) to:

```jsx
                    <div key={id} data-tour={idx === 0 ? 'first-row' : undefined} className="mes-card p-3">
```

md+ render (line 422): change `{materials.map((m) => {` to `{materials.map((m, idx) => {` and the first `<tr>` (line 428) to:

```jsx
                          <tr data-tour={idx === 0 ? 'first-row' : undefined}>
```

- [ ] **Step 7: Render the tour**

Before `{toastNode}` (line 576), add:

```jsx
      <GuidedTour
        open={tour.open}
        step={tour.step}
        stepIndex={tour.stepIndex}
        total={tour.total}
        isLast={tour.isLast}
        state={tourState}
        onNext={tour.next}
        onBack={tour.back}
        onClose={tour.close}
      />
```

- [ ] **Step 8: Verify lint and build pass**

Run: `npm run lint && npm run build`
Expected: both exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/views/forms/FormMaterialRequirements.js
git commit -m "feat(tour): wire guided tour into material requirements page"
```

---

### Task 5: End-to-end verification + progress docs

**Files:**
- Modify: `/Users/mac/dev/sfc-mes-v3/docs/progress.md` (append slice entry)
- Modify: `~/dev/SFCMES-V3-Vault/SFCMES-V3/wiki/progress.md` (append feature line)

**Interfaces:**
- Consumes: everything from Tasks 1-4 running in the browser.
- Produces: verified feature + updated progress trackers.

- [ ] **Step 1: Start the app**

Use the frontend `start-server` skill (`sfcmes-frontend-v3/.claude/skills/start-server/SKILL.md`) to start the Vite dev server; the backend must be running too (backend `start-server` skill) or the projects list will be empty.

- [ ] **Step 2: First-visit auto-start**

In the browser DevTools console: `localStorage.removeItem('mes-tour-material-requirements-v1')`, then navigate to `/forms/form-material-requirements` (logged in as Admin).
Expected: tour card appears ~0.5s after load, "ขั้นตอน 1/N", title "ยินดีต้อนรับสู่หน้าคำนวณวัสดุ".

- [ ] **Step 3: Interactive walk-through**

Click เริ่มทัวร์ → spotlight on the project picker with hint "ลองทำตามขั้นตอนนี้เพื่อไปต่อ" and **no** ถัดไป button. Tick a project → advances (~0.6s) to the calc button. Click คำนวณความต้องการ → after the result renders, tour advances to ตารางความต้องการวัสดุ. Continue with ถัดไป through results → first-row → (warnings, only if the banner is visible) → generate bar → ❓ finish step; เสร็จสิ้น closes the tour.
Expected: each spotlight hugs the right element; the page behind the shields is not clickable, but the spotlighted element is.

- [ ] **Step 4: Persistence + replay**

Reload the page. Expected: tour does **not** auto-start (`localStorage.getItem('mes-tour-material-requirements-v1')` returns `'1'`). Click the ❓ header button. Expected: tour restarts at step 1.

- [ ] **Step 5: Role gate**

Log in as a non-buyer/non-Admin user (any role other than `buyer`/`Admin`), replay the tour via ❓, walk to the end.
Expected: the สร้างใบสั่งซื้อ (ร่าง) step never appears; the tour jumps from the breakdown/warnings step straight to the ❓ finish step.

- [ ] **Step 6: Mobile layout**

DevTools responsive mode, 390×844. Replay the tour.
Expected: the card is a full-width bottom sheet; spotlights target the **card** list (not the hidden table); no horizontal page scroll; buttons ≥48px tall.

- [ ] **Step 7: Dismiss mid-tour**

`localStorage.removeItem('mes-tour-material-requirements-v1')`, reload, let the tour auto-start, press ข้าม at step 2, reload again.
Expected: no auto-start after the reload.

- [ ] **Step 8: Update progress trackers**

Append to `/Users/mac/dev/sfc-mes-v3/docs/progress.md` and to the material section of `~/dev/SFCMES-V3-Vault/SFCMES-V3/wiki/progress.md`:

```
- Guided tour on form-material-requirements (auto-start first visit, ❓ replay, role-gated steps) ✅ done
```

- [ ] **Step 9: Final commit + push**

```bash
git status   # verify only expected files changed
git add docs/superpowers/plans/2026-07-04-material-requirements-tour.md
git commit -m "docs(tour): mark material requirements tour plan complete"
git push origin re-design
```

(The wiki lives outside the repo — no git action needed there unless the vault is itself a repo; if it is, commit the progress line separately.)

---

## Self-Review Notes

- **Spec coverage:** auto-start + replay (T2 hook, T4 button, T5 §2/§4), interactive waitFor steps (T3 §waitFor effect, T4 steps 2-3), role/data gating incl. no-projects exit (T4 `when` gates, T5 §5), dual-render targets (T3 `findTarget`, T4 §5d/§6), tokens rule (T1), mobile bottom sheet + 48px (T3 card classes — `mes-btn` already enforces `min-height: 48px`, T5 §6), silent skip on missing element (T3 grace effect), Escape/ข้าม always available (T3).
- **Type consistency:** `useTour` return keys = `GuidedTour` props (`open, step, stepIndex, total, isLast`) + `state/onNext/onBack/onClose`; `TOUR_STEPS` targets = `data-tour` keys table in Task 4.
- **Known simplification:** `eligible` recomputes as state changes; steps behind the current index only gate on monotonic state within a run (documented in useTour comment).
