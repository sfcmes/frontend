// [MES] nav — single nav registry for sidebar + bottom nav.
// Fake-data entries (PR, Issues) removed per ADR-0005; add real ones when the features exist.

export const NAV_SECTIONS = [
  {
    label: 'HOME',
    items: [
      { id: 'dashboard', icon: 'aperture', title: 'ภาพรวมสถานะโครงการ', path: '/dashboards/modern' },
      { id: 'po', icon: 'file-invoice', title: 'ใบสั่งซื้อวัตถุดิบ (PO)', path: '/forms/form-po' },
      { id: 'materials', icon: 'cube', title: 'วัสดุและสูตร', path: '/forms/form-materials' },
      { id: 'material-requirements', icon: 'clipboard-check', title: 'คำนวณวัสดุ', path: '/forms/form-material-requirements' },
      { id: 'ai-chat', icon: 'message-chatbot', title: 'ผู้ช่วย AI', path: '/ai/chat' },
      { id: 'ai-report', icon: 'report', title: 'รายงานการผลิต', path: '/ai/report' },
    ],
  },
  {
    label: 'นำเข้าข้อมูลพรีคาสท์สู่ระบบ',
    items: [
      { id: 'new-project', icon: 'home-plus', title: 'สร้างโครงการใหม่', path: '/forms/form-project' },
      { id: 'new-section', icon: 'brand-codepen', title: 'สร้างข้อมูลชั้น', path: '/forms/form-section' },
      { id: 'new-comp', icon: 'box', title: 'สร้างข้อมูลชิ้นงาน', path: '/forms/form-component' },
    ],
  },
  {
    label: 'QR CODE',
    items: [
      { id: 'qr-read', icon: 'zoom-code', title: 'โปรแกรมอ่าน QR Code', path: '/forms/form-qr-code-reader' },
      { id: 'qr-make', icon: 'qrcode', title: 'โปรแกรมสร้าง QR Code', path: '/pages/qr-code' },
    ],
  },
  {
    label: 'AUTH',
    items: [
      { id: 'login', icon: 'login', title: 'เข้าสู่ระบบ', path: '/auth/login' },
      { id: 'register', icon: 'user-plus', title: 'ลงทะเบียนผู้ใช้งาน', path: '/auth/register' },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export function pageTitle(pathname) {
  const item = ALL_NAV_ITEMS.find((n) => n.path === pathname);
  return item ? item.title : null;
}
