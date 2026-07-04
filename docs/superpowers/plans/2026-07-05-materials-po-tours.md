# Materials + PO Guided Tours Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing guided-tour system into `/forms/form-materials` (8 Thai steps, one interactive tab-switch step) and `/forms/form-po` (6 passive Thai steps), each with first-visit auto-start and a ❓ replay button.

**Architecture:** Pure consumption of the committed tour system (`src/components/mes/tour/useTour.js` + `GuidedTour.jsx`) — the same pattern already live in `FormMaterialRequirements.js`: a module-level `TOUR_STEPS` array with `when`/`waitFor` gates, a `tourState` memo, `data-tour` attributes on targets (dual-tagged where a target renders twice for mobile/desktop), a ❓ button in `CardHeader`, and one `<GuidedTour />` render. **The tour core files must not be modified.**

**Tech Stack:** React 18, existing tour components, Tailwind token classes. No new dependencies, no new tokens, no new icons (`help-circle` exists).

**Spec:** `docs/superpowers/specs/2026-07-04-materials-po-tours-design.md` (approved).

## Global Constraints

- **Do NOT modify `src/components/mes/tour/useTour.js` or `src/components/mes/tour/GuidedTour.jsx`** (spec req 4).
- **No hex/rgba color values in any file this plan touches** (ADR-0006 rule 1); no status colors in tour UI.
- **All user-facing tour strings are Thai**; identifiers English.
- **localStorage keys (exact):** `mes-tour-materials-v1` (Task 1), `mes-tour-po-v1` (Task 2).
- **`TOUR_STEPS` must be a module-level constant** in each page (stable object identity — GuidedTour effects key off step identity).
- **`data-tour` values must exactly match `TOUR_STEPS` targets** (key maps in each task).
- Edits are additive: attributes, imports, constants, hook block, header button, render block. No refactoring of unrelated code; existing page logic must not change.
- **No test runner exists** — each task verifies with `npm run lint && npm run build` (both exit 0); Task 3 verifies end-to-end in the browser.
- **Git:** branch `re-design` (verify with `git branch --show-current`). One commit per task; stage only that task's file(s). Line numbers below refer to each file BEFORE edits — re-locate by the quoted code, not blindly by number.

---

### Task 1: Tour on FormMaterials

**Files:**
- Modify: `src/views/forms/FormMaterials.js` (imports at 1-11; constants after line 31; hook after line 94; header at 166; `data-tour` at 168, 170, 186, 199, 225, 271, 276-364; render before line 406)

**Interfaces:**
- Consumes: `useTour({ storageKey, steps, state })` → `{ open, step, stepIndex, total, isLast, start, next, back, close }`; `<GuidedTour open step stepIndex total isLast state onNext onBack onClose />`; icon `'help-circle'`.
- Produces: nothing later tasks depend on (Task 2 is independent; Task 3 verifies in browser).

`data-tour` key map (must match `TOUR_STEPS` targets exactly):

| key | element |
|---|---|
| `tab-bar` | tab bar wrapper div (line 168) |
| `recipes-tab` | the สูตรวัสดุ tab button only (inside `TABS.map`, line 170) |
| `materials-table` | mobile cards container (line 199) **and** md+ table wrapper (line 225) |
| `add-material` | เพิ่มวัสดุ button (line 186) |
| `create-recipe` | สร้างสูตร (ร่าง) button (line 271) |
| `recipes-list` | NEW wrapper div around the recipes loading/empty/list conditional (lines 276-364) — always present on the recipes tab, so the governance step works even when the list is empty |
| `help-button` | new ❓ button in `CardHeader` `right` slot |

- [ ] **Step 1: Add imports**

After line 11 (`import FVMaterialRecipe from './material-dialogs/FVMaterialRecipe';`) add:

```js
import { GuidedTour } from 'src/components/mes/tour/GuidedTour';
import { useTour } from 'src/components/mes/tour/useTour';
```

- [ ] **Step 2: Add the tour constants**

After the `TABS` constant (line 31, after its closing `];`), insert:

```js
// Guided tour — GuidedTour walks these top-to-bottom. `when` gates a step by
// page state (false → silently skipped), `waitFor` holds the step until the
// user really performs the action. Targets = data-tour attributes below.
const TOUR_STORAGE_KEY = 'mes-tour-materials-v1';
const TOUR_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'ยินดีต้อนรับสู่หน้าวัสดุและสูตร',
    body: 'หน้านี้จัดการทะเบียนวัสดุที่สั่งซื้อได้ และสูตรสำหรับคำนวณความต้องการวัสดุจากชิ้นงาน มาดูทีละส่วนกัน',
    nextLabel: 'เริ่มทัวร์',
  },
  {
    id: 'tabs',
    target: 'tab-bar',
    title: 'สองแท็บหลัก',
    body: '"ทะเบียนวัสดุ" คือรายการวัสดุทั้งหมดที่สั่งซื้อได้ ส่วน "สูตรวัสดุ" คือกติกาแปลงชิ้นงานเป็นยอดวัสดุที่ต้องใช้',
  },
  {
    id: 'materials-table',
    target: 'materials-table',
    when: (s) => s.tab === 'materials' && s.hasMaterials,
    title: 'ทะเบียนวัสดุ',
    body: 'แต่ละแถวคือวัสดุ 1 รายการ: รหัส หน่วย ขนาดแพ็ค สั่งขั้นต่ำ ผู้ขายหลัก และสถานะใช้งาน',
  },
  {
    id: 'add-material',
    target: 'add-material',
    when: (s) => s.tab === 'materials' && s.isBuyer,
    title: 'เพิ่มวัสดุ',
    body: 'กดปุ่มนี้เพื่อเพิ่มวัสดุใหม่ — แก้ไขหรือปิดใช้งานวัสดุเดิมได้จากปุ่มท้ายแถว',
  },
  {
    id: 'switch-recipes',
    target: 'recipes-tab',
    waitFor: (s) => s.tab === 'recipes',
    title: 'ไปดูสูตรวัสดุ',
    body: 'ลองกดแท็บ "สูตรวัสดุ" เพื่อดูส่วนสูตรการคำนวณ',
  },
  {
    id: 'create-recipe',
    target: 'create-recipe',
    when: (s) => s.tab === 'recipes',
    title: 'สร้างสูตร (ร่าง)',
    body: 'กำหนดว่าชิ้นงานประเภทไหนใช้วัสดุอะไร: แหล่งค่า (ปริมาตร/พื้นที่/น้ำหนัก/ต่อชิ้น) × ตัวคูณ × เผื่อเสีย% — ทุกคนสร้างร่างได้',
  },
  {
    id: 'governance',
    target: 'recipes-list',
    when: (s) => s.tab === 'recipes',
    title: 'ร่าง → เปิดใช้งาน',
    body: 'สูตรเริ่มที่สถานะ "ร่าง" ผู้ดูแลระบบเป็นผู้กดเปิดใช้งาน (รุ่นเดิมของคู่เดียวกันถูกปลดอัตโนมัติ) — การคำนวณวัสดุใช้เฉพาะสูตรที่ "ใช้งาน"',
  },
  {
    id: 'finish',
    target: 'help-button',
    title: 'จบทัวร์แล้ว',
    body: 'อยากดูทัวร์นี้อีกครั้ง กดปุ่มนี้ได้ตลอดเวลา',
  },
];
```

- [ ] **Step 3: Wire the hook**

After the `activeMaterials` memo (line 94: `const activeMaterials = useMemo(() => materials.filter((m) => m.active), [materials]);`), add:

```js
  // ---- guided tour ----
  const tourState = useMemo(
    () => ({
      tab,
      hasMaterials: !materialsLoading && materials.length > 0,
      isBuyer,
      isAdmin,
    }),
    [tab, materialsLoading, materials.length, isBuyer, isAdmin],
  );
  const tour = useTour({ storageKey: TOUR_STORAGE_KEY, steps: TOUR_STEPS, state: tourState });
```

- [ ] **Step 4: Add the ❓ replay button**

Line 166 currently:

```jsx
      <CardHeader title="วัสดุและสูตรการคำนวณ" />
```

Change to:

```jsx
      <CardHeader
        title="วัสดุและสูตรการคำนวณ"
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

- [ ] **Step 5: Tag the targets with `data-tour`**

a. Tab bar wrapper (line 168): `<div className="flex gap-1 overflow-x-auto border-b border-mes-border px-3 pt-2">` → `<div data-tour="tab-bar" className="flex gap-1 overflow-x-auto border-b border-mes-border px-3 pt-2">`

b. Recipes tab button (line 170, inside `TABS.map`): add the conditional attribute so only the สูตรวัสดุ button is tagged:

```jsx
          <button
            key={t.key}
            data-tour={t.key === 'recipes' ? 'recipes-tab' : undefined}
            onClick={() => setTab(t.key)}
```

(rest of the button unchanged)

c. Add-material button (line 186): `<button className="mes-btn mes-btn-primary" onClick={openCreateMaterial}>` → `<button data-tour="add-material" className="mes-btn mes-btn-primary" onClick={openCreateMaterial}>`

d. Materials — both renders get `data-tour="materials-table"`:
   - mobile cards div (line 199): `<div data-tour="materials-table" className="flex flex-col gap-2 p-3 md:hidden">`
   - md+ wrapper div (line 225): `<div data-tour="materials-table" className="hidden md:block">`

e. Create-recipe button (line 271): `<button className="mes-btn mes-btn-primary" onClick={() => setRecipeFormOpen(true)}>` → `<button data-tour="create-recipe" className="mes-btn mes-btn-primary" onClick={() => setRecipeFormOpen(true)}>`

- [ ] **Step 6: Wrap the recipes list in the `recipes-list` target**

The recipes-tab pane (lines 276-364) currently renders the conditional directly:

```jsx
          {recipesLoading ? (
            <Spinner />
          ) : recipesByType.length === 0 ? (
            <EmptyState icon="clipboard-list" title="ยังไม่มีสูตรในระบบ" />
          ) : (
            <div className="flex flex-col gap-5 p-3 md:p-5">
              ...
            </div>
          )}
```

Wrap the whole conditional in one new div (indent the conditional one level; nothing else changes):

```jsx
          <div data-tour="recipes-list">
            {recipesLoading ? (
              <Spinner />
            ) : recipesByType.length === 0 ? (
              <EmptyState icon="clipboard-list" title="ยังไม่มีสูตรในระบบ" />
            ) : (
              <div className="flex flex-col gap-5 p-3 md:p-5">
                ...
              </div>
            )}
          </div>
```

(`...` = the existing `recipesByType.map` block, unchanged — only indentation shifts.)

- [ ] **Step 7: Render the tour**

Before `{toastNode}` (line 406), add:

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

- [ ] **Step 8: Verify lint and build**

Run: `npm run lint && npm run build`
Expected: both exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/views/forms/FormMaterials.js
git commit -m "feat(tour): guided tour on form-materials (tabs, registry, recipe governance)"
```

---

### Task 2: Tour on FormPO

**Files:**
- Modify: `src/views/forms/FormPO.js` (imports at 1-17; constants after line 39; hook after line 81; header at 203-210; `data-tour` at 212, 233, 237, 254, 268, 271; render before line 326)

**Interfaces:**
- Consumes: same tour system interfaces as Task 1 (`useTour`, `GuidedTour`, `'help-circle'` icon).
- Produces: nothing later tasks depend on.

`data-tour` key map:

| key | element |
|---|---|
| `create-po` | existing สร้าง PO ใหม่ button in CardHeader right (line 206) |
| `status-tabs` | status tab bar wrapper div (line 212) |
| `po-table` | mobile cards container (line 233) **and** md+ table wrapper (line 254) |
| `first-row` | first mobile card (line 237) **and** first md+ row (line 271), via `idx === 0` |
| `help-button` | new ❓ button next to สร้าง PO ใหม่ |

- [ ] **Step 1: Add imports**

After line 17 (`import PODetailDialog from './po-dialogs/PODetailDialog';`) add:

```js
import { GuidedTour } from 'src/components/mes/tour/GuidedTour';
import { useTour } from 'src/components/mes/tour/useTour';
```

- [ ] **Step 2: Add the tour constants**

After the `dateStr` helper (line 39: `const dateStr = (d) => (d ? String(d).slice(0, 10) : '-');`), insert:

```js
// Guided tour — GuidedTour walks these top-to-bottom. `when` gates a step by
// page state (false → silently skipped). All steps are passive (ถัดไป only) —
// the status tabs are just filters, so nothing forces user interaction.
const TOUR_STORAGE_KEY = 'mes-tour-po-v1';
const TOUR_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'ยินดีต้อนรับสู่หน้าใบสั่งซื้อ',
    body: 'หน้านี้ติดตามใบสั่งซื้อวัตถุดิบ (PO) ตั้งแต่ฉบับร่างจนรับของเข้าคลัง มาดูทีละส่วนกัน',
    nextLabel: 'เริ่มทัวร์',
  },
  {
    id: 'create-po',
    target: 'create-po',
    title: 'สร้าง PO ใหม่',
    body: 'กดปุ่มนี้เพื่อสร้างใบสั่งซื้อ — บันทึกเป็นฉบับร่างก่อน หรือส่งให้ผู้จัดซื้อเลยก็ได้ (ระบบส่งอีเมลแจ้งอัตโนมัติ)',
  },
  {
    id: 'status-tabs',
    target: 'status-tabs',
    title: 'วงจรสถานะ PO',
    body: 'PO เดินทางจาก ร่าง → รอสั่งซื้อ → สั่งซื้อแล้ว → รับของแล้ว — กดแท็บเพื่อกรองรายการตามสถานะ',
  },
  {
    id: 'po-table',
    target: 'po-table',
    when: (s) => s.hasPOs,
    title: 'รายการใบสั่งซื้อ',
    body: 'แต่ละแถวแสดง เลขที่ PO โครงการ จำนวนรายการ วันที่สร้าง กำหนดส่ง และสถานะ',
  },
  {
    id: 'row-actions',
    target: 'first-row',
    when: (s) => s.hasPOs,
    title: 'ปุ่มดำเนินการตามสถานะ',
    body: 'ปุ่มท้ายแถวเปลี่ยนตามสถานะ — ร่าง: แก้ไข/ลบ · รอสั่งซื้อ: ยืนยันสั่งซื้อ (ผู้จัดซื้อ/Admin) · สั่งซื้อแล้ว: ยืนยันรับของ (ผู้จัดซื้อ/Admin) · อื่นๆ: ดูรายละเอียด',
  },
  {
    id: 'finish',
    target: 'help-button',
    title: 'จบทัวร์แล้ว',
    body: 'อยากดูทัวร์นี้อีกครั้ง กดปุ่มนี้ได้ตลอดเวลา',
  },
];
```

- [ ] **Step 3: Wire the hook**

After the `filtered` derivation (line 81: `const filtered = tab === 'all' ? rows : rows.filter((r) => r.status === tab);`), add:

```js
  // ---- guided tour ----
  const tourState = useMemo(
    () => ({ hasPOs: !loading && filtered.length > 0, isBuyer }),
    [loading, filtered.length, isBuyer],
  );
  const tour = useTour({ storageKey: TOUR_STORAGE_KEY, steps: TOUR_STEPS, state: tourState });
```

- [ ] **Step 4: Add the ❓ replay button + tag create-po**

Lines 203-210 currently:

```jsx
      <CardHeader
        title="ใบสั่งซื้อวัตถุดิบ (PO)"
        right={
          <button className="mes-btn mes-btn-primary" onClick={openCreate}>
            <Icon name="plus" size={15} /> สร้าง PO ใหม่
          </button>
        }
      />
```

Change to (❓ first so the primary action stays rightmost; `CardHeader`'s right slot is already `flex items-center gap-2`):

```jsx
      <CardHeader
        title="ใบสั่งซื้อวัตถุดิบ (PO)"
        right={
          <>
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
            <button data-tour="create-po" className="mes-btn mes-btn-primary" onClick={openCreate}>
              <Icon name="plus" size={15} /> สร้าง PO ใหม่
            </button>
          </>
        }
      />
```

- [ ] **Step 5: Tag the remaining targets**

a. Status tab bar (line 212): `<div className="flex gap-1 overflow-x-auto border-b border-mes-border px-3 pt-2">` → `<div data-tour="status-tabs" className="flex gap-1 overflow-x-auto border-b border-mes-border px-3 pt-2">`

b. PO list — both renders get `data-tour="po-table"`:
   - mobile cards div (line 233): `<div data-tour="po-table" className="flex flex-col gap-2 p-3 md:hidden">`
   - md+ wrapper div (line 254): `<div data-tour="po-table" className="hidden md:block">`

c. First row — both renders need the map index:
   - mobile (line 234): `{filtered.map((po) => {` → `{filtered.map((po, idx) => {` and the card div (line 237):

```jsx
                <div key={po.id} data-tour={idx === 0 ? 'first-row' : undefined} className={`mes-card p-3 ${isHi ? 'border-mes-accent' : ''}`}>
```

   - md+ (line 268): `{filtered.map((po) => {` → `{filtered.map((po, idx) => {` and the `<tr>` (line 271):

```jsx
                    <tr
                      key={po.id}
                      data-tour={idx === 0 ? 'first-row' : undefined}
                      className={isHi ? 'bg-mes-surface-2' : ''}
                      style={isHi ? { boxShadow: 'inset 3px 0 0 var(--mes-accent)' } : undefined}
                    >
```

- [ ] **Step 6: Render the tour**

Before `{toastNode}` (line 326), add:

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

- [ ] **Step 7: Verify lint and build**

Run: `npm run lint && npm run build`
Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/views/forms/FormPO.js
git commit -m "feat(tour): guided tour on form-po (create, status lifecycle, row actions)"
```

---

### Task 3: End-to-end verification + progress docs

**Files:**
- Modify: `/Users/mac/dev/sfc-mes-v3/docs/progress.md` (append slice entry)
- Modify: `~/dev/SFCMES-V3-Vault/SFCMES-V3/wiki/progress.md` (append feature line)

**Interfaces:**
- Consumes: Tasks 1-2 running in the browser (Vite dev server on :5173, backend on :3000, logged in as Admin).
- Produces: verified feature + updated trackers.

- [ ] **Step 1: FormMaterials — desktop walk-through**

DevTools console: `localStorage.removeItem('mes-tour-materials-v1')`, navigate to `/forms/form-materials`.
Expected: tour auto-starts (~0.5s) at "ยินดีต้อนรับสู่หน้าวัสดุและสูตร". Walk: เริ่มทัวร์ → tab-bar → materials table → เพิ่มวัสดุ (Admin sees it) → "ไปดูสูตรวัสดุ" shows the hint with **no** ถัดไป → click the สูตรวัสดุ tab → tour advances (~0.6s) → สร้างสูตร (ร่าง) → recipes list (governance) → ❓ finish → เสร็จสิ้น.
Each spotlight hugs its element; shields block clicks outside; the สูตรวัสดุ tab button inside the spotlight is clickable.

- [ ] **Step 2: FormMaterials — persistence + replay**

Reload → no auto-start (`localStorage.getItem('mes-tour-materials-v1')` returns `'1'`). Click ❓ → tour restarts at step 1. Replay while already on the สูตรวัสดุ tab → the materials-table and add-material steps are skipped (their `when` fails) and the switch-recipes step auto-advances (waitFor already true) — tour still reaches finish without errors.

- [ ] **Step 3: FormPO — desktop walk-through**

`localStorage.removeItem('mes-tour-po-v1')`, navigate to `/forms/form-po`.
Expected: auto-start → เริ่มทัวร์ → สร้าง PO ใหม่ button (spotlight in the header) → status tabs → PO table (skipped if list empty) → first row actions (skipped if list empty) → ❓ finish. All steps have a ถัดไป button (no waitFor holds).

- [ ] **Step 4: FormPO — persistence + replay + header layout**

Reload → no auto-start. ❓ → replays. Confirm the ❓ button sits next to สร้าง PO ใหม่ without breaking the header on a narrow viewport (CardHeader wraps).

- [ ] **Step 5: Mobile spot-check (both pages)**

Responsive mode 390×844, replay each tour.
Expected: card is a bottom sheet; spotlights target the visible mobile render (cards, not the hidden table); no horizontal scroll.

- [ ] **Step 6: Console check**

Read the browser console for errors on both pages during the walks. Expected: none.

- [ ] **Step 7: Update progress trackers**

Append to `/Users/mac/dev/sfc-mes-v3/docs/progress.md`:

```
- Guided tours on form-materials (8 steps, interactive tab-switch) and form-po (6 steps) reusing the tour system — verified E2E in browser
```

Append to the material section of `~/dev/SFCMES-V3-Vault/SFCMES-V3/wiki/progress.md`:

```
- Guided tours on form-materials + form-po (reused useTour/GuidedTour, zero core changes) ✅ done
```

- [ ] **Step 8: Push**

```bash
git status   # only expected files
git push origin re-design
```

---

## Self-Review Notes

- **Spec coverage:** behavior parity + per-page keys (T1/T2 constants, T3 §2/§4), page-level only — no dialog steps (step lists), one waitFor on form-materials / passive form-po (T1 step 5 vs T2 all-passive), no tour-core changes (Global Constraints + no tour-file edits in any task), dual-render targets (T1 §5d, T2 §5b-c), recipes-list works when empty (T1 §6 wrapper div), `?project=` deep-link accepted-as-is (spec edge case — no code needed), verification incl. mobile + header wrap (T3).
- **Type consistency:** `tourState` keys referenced by `when`/`waitFor` — T1: `tab`, `hasMaterials`, `isBuyer` (memo also carries `isAdmin` per spec, unused by steps — informational governance copy instead); T2: `hasPOs` (`isBuyer` in state for parity, unused by steps since action buttons exist for every role). `data-tour` keys match step targets 1:1 in both tables.
- **Known simplification:** form-materials steps 3-4 gate on `tab === 'materials'` so a replay started from the recipes tab skips them — accepted spec behavior (noted in spec step table).
