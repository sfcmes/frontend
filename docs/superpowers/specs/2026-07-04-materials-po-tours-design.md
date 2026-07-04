# Design: Guided Tours — วัสดุและสูตร (FormMaterials) + ใบสั่งซื้อ (FormPO)

- **Date:** 2026-07-04
- **Status:** Approved (brainstorming session)
- **Pages:** `/forms/form-materials` (`src/views/forms/FormMaterials.js`, ~411 lines), `/forms/form-po` (`src/views/forms/FormPO.js`, ~331 lines)
- **Prerequisite:** the tour system from `2026-07-04-material-requirements-tour-design.md` — `src/components/mes/tour/useTour.js` + `src/components/mes/tour/GuidedTour.jsx` (committed `13177cd`/`064cba6`, localStorage guard `e8d572f`)

## Problem

หน้า วัสดุและสูตร (2 แท็บ + governance ร่าง→เปิดใช้งาน) และหน้า PO (4 แท็บสถานะ + ปุ่ม action เปลี่ยนตามสถานะ) มี flow ที่ user ใหม่ไม่คุ้น — ต้องการ guided tour แบบเดียวกับหน้าคำนวณวัสดุ

## Requirements (confirmed with user)

1. พฤติกรรมเหมือนหน้าคำนวณวัสดุทุกอย่าง: เด้งอัตโนมัติครั้งแรก (แยก localStorage key ต่อหน้า) + ปุ่ม ❓ ดูซ้ำ + สเต็ปซ่อนตาม role/data อัตโนมัติ
2. **ระดับหน้าเท่านั้น** — tour ไม่เปิด dialog จริง (อธิบายว่าปุ่มเปิดอะไรแทน)
3. Interactivity: form-materials มี 1 สเต็ป `waitFor` (รอ user กดแท็บสูตรวัสดุ — สเต็ปถัดไปชี้ element ในแท็บนั้น); form-po passive ล้วน (แท็บเป็นแค่ filter)
4. **ห้ามแก้ `GuidedTour.jsx` / `useTour.js`** — reuse ตรงๆ พิสูจน์ความ generic

## Architecture

แต่ละหน้าได้ pattern เดียวกับ FormMaterialRequirements:

```
src/views/forms/FormMaterials.js   (แก้)
├── import { GuidedTour } / { useTour }
├── TOUR_STORAGE_KEY = 'mes-tour-materials-v1' + TOUR_STEPS (module-level, 8 steps)
├── tourState memo + const tour = useTour({...})
├── data-tour: tab-bar, materials-table (ทั้ง card และ table render), add-material,
│              recipes-tab (ปุ่มแท็บสูตรวัสดุ), create-recipe, recipes-list, help-button
├── ปุ่ม ❓ ใน CardHeader right (เดิมไม่มี right)
└── <GuidedTour ... /> ก่อน toastNode

src/views/forms/FormPO.js   (แก้)
├── เหมือนกัน, TOUR_STORAGE_KEY = 'mes-tour-po-v1' + TOUR_STEPS (6 steps)
├── data-tour: create-po, status-tabs, po-table (ทั้ง card และ table render),
│              first-row (แถวแรก ทั้งสอง render), help-button
├── ปุ่ม ❓ วางข้างปุ่ม "สร้าง PO ใหม่" ใน CardHeader right (มี right อยู่แล้ว)
└── <GuidedTour ... /> ก่อน toastNode
```

**Files NOT changed:** `src/components/mes/tour/*` (ห้ามแตะ), `tokens.css`, `Icon.jsx` (token/icon มีแล้ว), dialogs ทุกตัว

## Tour Steps — FormMaterials (8 สเต็ป)

tourState: `{ tab, hasMaterials: !materialsLoading && materials.length > 0, isBuyer, isAdmin }`

| # | id | target | เนื้อหา (แนวทาง — คนเขียน plan เกลาภาษาได้) | gate |
|---|---|---|---|---|
| 1 | welcome | null | ยินดีต้อนรับสู่หน้าวัสดุและสูตร — จัดการทะเบียนวัสดุและสูตรคำนวณความต้องการ | nextLabel: เริ่มทัวร์ |
| 2 | tabs | tab-bar | สองแท็บ: ทะเบียนวัสดุ (รายการวัสดุที่สั่งซื้อได้) / สูตรวัสดุ (กติกาแปลงชิ้นงานเป็นยอดวัสดุ) | — |
| 3 | materials-table | materials-table | คอลัมน์สำคัญ: รหัส หน่วย ขนาดแพ็ค สั่งขั้นต่ำ ผู้ขายหลัก สถานะ | `when: tab==='materials' && hasMaterials` |
| 4 | add-material | add-material | ปุ่มเพิ่มวัสดุ — เพิ่ม/แก้ไข/ปิดใช้งานทะเบียนวัสดุ | `when: isBuyer && tab==='materials'` |
| 5 | switch-recipes | recipes-tab | ลองกดแท็บ "สูตรวัสดุ" เพื่อไปดูส่วนสูตร | `waitFor: tab==='recipes'` |
| 6 | create-recipe | create-recipe | สร้างสูตร (ร่าง) — ระบุประเภทชิ้นงาน × วัสดุ × แหล่งค่า × ตัวคูณ; ทุก role สร้างร่างได้ | `when: tab==='recipes'` |
| 7 | governance | recipes-list | สูตรมีสถานะ ร่าง → ผู้ดูแลระบบกดเปิดใช้งาน (รุ่นเดิมของคู่เดียวกันถูกปลดอัตโนมัติ) — คำนวณวัสดุใช้เฉพาะสูตรที่เปิดใช้งาน | `when: tab==='recipes'` |
| 8 | finish | help-button | จบทัวร์ — กด ❓ ดูซ้ำได้ตลอด | — |

หมายเหตุ: สเต็ป 3-4 อยู่แท็บวัสดุ ถ้า user replay ตอนอยู่แท็บสูตร → `when` ข้ามให้เอง (พฤติกรรมถูกต้อง ไม่ต้อง special-case) สเต็ป 7 target คือ container รายการสูตร (มี EmptyState ก็ยังชี้ได้ — ชี้ทั้งบล็อก)

## Tour Steps — FormPO (6 สเต็ป)

tourState: `{ hasPOs: !loading && filtered.length > 0, isBuyer }`

| # | id | target | เนื้อหา (แนวทาง) | gate |
|---|---|---|---|---|
| 1 | welcome | null | ยินดีต้อนรับสู่หน้าใบสั่งซื้อ — ติดตาม PO ตั้งแต่ร่างจนรับของเข้าคลัง | nextLabel: เริ่มทัวร์ |
| 2 | create-po | create-po | สร้าง PO ใหม่ → บันทึกฉบับร่าง หรือส่งให้ผู้จัดซื้อ (ระบบส่งอีเมลแจ้ง) | — |
| 3 | status-tabs | status-tabs | วงจร PO: ร่าง → รอสั่งซื้อ → สั่งซื้อแล้ว → รับของแล้ว; แท็บ = ตัวกรองสถานะ | — |
| 4 | po-table | po-table | คอลัมน์: เลขที่ PO / โครงการ / รายการ / กำหนดส่ง / สถานะ | `when: hasPOs` |
| 5 | row-actions | first-row | ปุ่มท้ายแถวเปลี่ยนตามสถานะ — ร่าง: แก้ไข/ลบ · รอสั่งซื้อ: ยืนยันสั่งซื้อ* · สั่งซื้อแล้ว: ยืนยันรับของ* · อื่นๆ: ดูรายละเอียด (*เฉพาะผู้จัดซื้อ/Admin) | `when: hasPOs` |
| 6 | finish | help-button | จบทัวร์ — กด ❓ ดูซ้ำได้ตลอด | — |

หมายเหตุ: สเต็ป 5 ไม่ gate ด้วย role — ปุ่ม action มีทุก role (แค่ชนิดต่างกัน) เนื้อหาอธิบาย * ไว้แล้ว

## data-tour key map

**FormMaterials:** `tab-bar` (div ครอบปุ่มแท็บ), `materials-table` (ทั้ง card block และ table block), `add-material` (ปุ่ม เพิ่มวัสดุ), `recipes-tab` (ปุ่มแท็บสูตรวัสดุ — ตัวปุ่ม ไม่ใช่ทั้งแถบ), `create-recipe` (ปุ่ม สร้างสูตร (ร่าง)), `recipes-list` (container รายการสูตร), `help-button` (ปุ่ม ❓ ใหม่)

**FormPO:** `create-po` (ปุ่ม สร้าง PO ใหม่ — มีอยู่แล้วใน CardHeader right), `status-tabs` (div ครอบแท็บ 4 สถานะ), `po-table` (ทั้ง card block และ table block), `first-row` (แถว/การ์ดแรก `idx === 0` ทั้งสอง render), `help-button` (ปุ่ม ❓ ใหม่ ข้างปุ่มสร้าง PO)

## Behavior & edge cases (inherit จากระบบเดิม — ไม่ต้อง implement ใหม่)

- Auto-start ครั้งแรก (~500ms), seen-flag เขียนเมื่อจบ/ข้าม, ❓ replay, Escape ปิด
- Element ไม่อยู่ใน DOM / `when` false → ข้ามเงียบ (คุม role + tab + empty-state ทั้งหมด)
- Mobile: bottom sheet + เลือก render ที่มองเห็นจริง (`offsetParent`)
- ลิสต์ว่าง (ไม่มีวัสดุ/สูตร/PO): สเต็ปที่ gate ด้วย has* ถูกข้าม — tour ยังเดินจบได้ (welcome → tabs/ปุ่ม → finish)
- FormPO `?highlight=` / `?project=` deep links: tour เด้งครั้งแรกได้ตามปกติ ถ้า `?project=` เปิด create dialog อัตโนมัติ dialog (z-50) อยู่ใต้ tour (z-70) — ยอมรับได้: กรณีนี้เกิดเฉพาะ deep-link ครั้งแรกครั้งเดียว และ user กดข้ามได้เสมอ

## Design-rule compliance

เหมือน spec แรก: ไม่มี hex นอก tokens.css (ไม่เพิ่ม token ใหม่), string ไทยทั้งหมด, ไม่แตะ status colors, `data-tour` เป็น attribute ล้วนไม่กระทบ logic เดิม

## Verification (manual — no test runner)

ต่อหน้า (ทั้ง desktop และ mobile viewport):
1. ล้าง key → เข้าหน้า → tour เด้งเอง เดินครบทุกสเต็ป (form-materials: กดแท็บสูตรจริงที่สเต็ป 5)
2. รีเฟรช → ไม่เด้งซ้ำ; ❓ → replay
3. `npm run lint && npm run build` ผ่าน
4. ระหว่าง tour คลิกอะไรนอก spotlight ไม่ได้ / ใน spotlight ได้
5. form-po: เช็คว่าปุ่ม ❓ ไม่เบียดปุ่มสร้าง PO บนจอมือถือ (CardHeader right wrap ได้)

## Out of scope

- แก้ไข tour core (`useTour.js`, `GuidedTour.jsx`)
- Tour ใน dialog ใดๆ
- Role-gate E2E ด้วย user non-buyer (ยืนยันด้วยกลไก `when` ที่พิสูจน์แล้ว)
