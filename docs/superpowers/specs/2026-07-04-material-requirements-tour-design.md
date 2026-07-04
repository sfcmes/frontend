# Design: Guided Tour — หน้าคำนวณวัสดุ (Material Requirements)

- **Date:** 2026-07-04
- **Status:** Approved (brainstorming session)
- **Page:** `/forms/form-material-requirements` (`src/views/forms/FormMaterialRequirements.js`)

## Problem

ฟีเจอร์คำนวณวัสดุมี flow หลายขั้น (เลือกโครงการ → คำนวณ → อ่านตาราง → drilldown → สร้าง PO ร่าง)
และบางส่วนของหน้าโผล่หลังคำนวณเท่านั้น — user ใหม่ไม่รู้ว่าต้องเริ่มตรงไหน
ต้องการ interactive guided tour บนหน้าจริง แทนคู่มือ text

## Requirements (confirmed with user)

1. เด้งอัตโนมัติครั้งแรกที่เข้าหน้า (จำด้วย localStorage) + ปุ่ม ❓ เปิดดูซ้ำได้ตลอด
2. พาทำจริงทีละสเต็ป — tour รอ user เลือกโครงการจริง / กดคำนวณจริง แล้วค่อยไปต่อ
3. สเต็ปสร้าง PO แสดงเฉพาะ buyer/Admin — role อื่นข้ามเงียบๆ
4. รองรับทั้งมือถือ (<md) และ desktop (md+)
5. ข้อความ UI เป็นภาษาไทยทั้งหมด (Thai-first ตาม CLAUDE.md)

## Decision: Custom tour component (over driver.js / static modal)

เขียน `GuidedTour` เอง เพราะ:
- ผ่านกฎ ADR-0006 (no hex outside tokens.css, dark-only) ตรงๆ — ไม่ต้อง override style ของ library
- สเต็ปแบบ `waitFor(pageState)` (รอ state จริง) เขียนเป็น React ตรงๆ ง่ายกว่าดัด event ของ library
- ไม่เพิ่ม dependency; เป็นรากฐานให้หน้าอื่นใช้ต่อได้

ทางเลือกที่ตัดทิ้ง: **driver.js** (ต้อง override styles ทั้งชุด + hack event เพื่อรอ state), **modal สอนแบบสไลด์** (ไม่ interactive — ไม่ตรงโจทย์)

## Architecture

```
src/components/mes/tour/
├── GuidedTour.jsx    Overlay มืด + spotlight เจาะรอบ element เป้าหมาย + การ์ดอธิบาย
└── useTour.js        State: สเต็ปปัจจุบัน, next/back/skip, seen-flag ผ่าน localStorage

src/views/forms/FormMaterialRequirements.js   (แก้)
├── เพิ่ม data-tour="..." บน element เป้าหมาย (~6 จุด, ใส่ทั้ง card และ table render)
├── นิยาม TOUR_STEPS (ข้อความไทย + waitFor conditions)
└── ปุ่ม ❓ "วิธีใช้งาน" ที่ header เปิดทัวร์ซ้ำ

src/styles/tokens.css   (แก้)
└── เพิ่ม token สี dim/spotlight ของ tour (กฎ no-hex)
```

**Generic boundary:** `GuidedTour` ไม่รู้จักหน้า material เลย — รับ `steps[]`, `state` (object ที่ waitFor อ่าน), `open`, `onClose`. หน้าอื่นนำไปใช้ได้โดยนิยาม steps ของตัวเอง

**Step shape:**

```js
{
  target: 'project-picker',        // data-tour value; null = การ์ดกลางจอ
  title: 'เลือกโครงการ',
  body: 'ติ๊กเลือกโครงการที่ต้องการ…',
  waitFor: (s) => s.selectedCount > 0,  // optional; มี waitFor = ซ่อนปุ่มถัดไป รอ state จริง
  when: (s) => s.isBuyer,               // optional; false = ข้ามสเต็ปเงียบๆ
}
```

**localStorage key:** `mes-tour-material-requirements-v1`

## Tour Steps (8 สเต็ป)

| # | target | เนื้อหา (ย่อ) | ไปต่อเมื่อ |
|---|---|---|---|
| 1 | — (กลางจอ) | ยินดีต้อนรับ — หน้านี้ช่วยคำนวณวัสดุที่ต้องสั่งเพิ่ม | กด "เริ่มทัวร์" |
| 2 | project-picker | ติ๊กเลือกโครงการ (เลือกได้หลายโครงการ) | ✋ waitFor: เลือกแล้ว ≥1 |
| 3 | calc-button | กดปุ่มนี้เพื่อคำนวณ | ✋ waitFor: result != null |
| 4 | results-table | อธิบายคอลัมน์ ต้องใช้(ฐาน)/ปัดขึ้น/สั่งแล้ว-ค้างรับ/ต้องสั่งเพิ่ม | ถัดไป |
| 5 | first-row | กดแถวเพื่อดู breakdown รายชิ้นงาน (ค่าที่ใช้ × ตัวคูณ × เผื่อเสีย%) | ถัดไป |
| 6 | warnings-banner | อธิบายคำเตือน + ชี้ไปหน้าวัสดุและสูตร | ถัดไป *(when: มีคำเตือน)* |
| 7 | generate-bar | เลือกวัสดุ → สร้าง PO ร่างแยกตามผู้ขาย | ถัดไป *(when: buyer/Admin)* |
| 8 | help-button | จบ — กด ❓ ดูซ้ำได้ตลอด | เสร็จสิ้น |

ทุกสเต็ปมีปุ่ม "ข้าม" ออกได้เสมอ สเต็ปที่มี `waitFor` ซ่อนปุ่ม "ถัดไป" — บังคับทำจริง

## Responsive behavior

| | มือถือ (<md) | Desktop (md+) |
|---|---|---|
| การ์ดอธิบาย | bottom sheet ติดขอบล่าง (pattern เดียวกับ `Modal`) | tooltip ลอยข้างเป้าหมาย บน/ล่างตามพื้นที่ว่าง |
| เป้าหมาย | card block (`md:hidden`) | `<table>` |
| ปุ่ม | เต็มกว้าง สูง ≥48px | ปกติ |

- `data-tour` ใส่ทั้งสอง render — GuidedTour เลือกตัวที่มองเห็นจริง (`offsetParent != null`)
- เข้าสเต็ปใหม่ → `scrollIntoView` กลางจอก่อนวาด spotlight
- recompute ตำแหน่งเมื่อ resize/scroll (debounced)

## Edge cases

- **หา element ไม่เจอ / `when` เป็น false** → ข้ามสเต็ปเงียบๆ (กลไกเดียว ใช้ gate สเต็ป 6-7 ด้วย)
- **ไม่มีโครงการ / API พัง** → สเต็ป 2 มีปุ่มข้ามเสมอ; ถ้า `projects.length === 0` แสดงข้อความแนะนำสร้างโครงการก่อนแล้วจบทัวร์
- **ปิดกลางทาง** → set seen-flag ทันที ไม่เด้งซ้ำ (ดูซ้ำผ่าน ❓)
- **user ทำล้ำหน้า tour** → `waitFor` อ่าน state ปัจจุบัน — ถึงเงื่อนไขแล้ว tour เลื่อนตามเอง
- **เด้งอัตโนมัติ** → หน่วง ~500ms หลัง mount รอ layout นิ่ง

## Design-rule compliance (ADR-0006)

- สี dim/spotlight เป็น token ใหม่ใน `tokens.css` — ไม่มี hex ใน component
- ไม่ใช้สี status ใน tour UI (กฎข้อ 2)
- `GuidedTour.jsx` มี header comment `// [MES] GuidedTour — …` (กฎข้อ 5)
- Mobile-first, touch target 48px (กฎข้อ 6)

## Verification (manual — no test runner in repo)

1. localStorage ว่าง → เข้าหน้า → tour เด้งเอง เดินครบ 8 สเต็ป (เลือกโครงการจริง กดคำนวณจริง)
2. role ทั่วไป (ไม่ใช่ buyer/Admin) → สเต็ป 7 ถูกข้าม
3. จอมือถือ → bottom sheet + ชี้ card ถูกตัว, ไม่มี horizontal scroll
4. รีเฟรช → ไม่เด้งซ้ำ; กด ❓ → เปิดทัวร์ใหม่ได้
5. โครงการว่าง/ไม่มีคำเตือน → สเต็ปที่เกี่ยวข้อง gate ถูกต้อง

## Out of scope

- Tour สำหรับหน้าอื่น (component รองรับแล้ว แต่ยังไม่ทำ steps)
- Analytics ว่า user ดูจบกี่ %
- เนื้อหาคู่มือ text แยกต่างหาก
