// [MES] questionBank — curated Thai question bank for the AI assistant; single source of
// truth for empty-state chips and the capabilities sheet. Every question maps to a real
// backend tool (no aspirational entries): list_project_summaries, get_project_detail,
// search_components, get_component_status_history, get_po_status, chart_project_status,
// chart_section_progress.

export const QUESTION_GROUPS = [
  {
    key: 'projects',
    title: 'ความคืบหน้าโครงการ',
    questions: [
      'โครงการไหนคืบหน้าช้าที่สุด?',
      'สรุปความคืบหน้าของทุกโครงการ',
      'โครงการไหนใกล้เสร็จที่สุด?',
    ],
  },
  {
    key: 'components',
    title: 'ชิ้นงาน',
    questions: [
      'มีชิ้นงานถูกปฏิเสธบ้างไหม',
      'ค้นหาชิ้นงานจากชื่อ แล้วดูประวัติสถานะได้ไหม',
    ],
  },
  {
    key: 'po',
    title: 'ใบสั่งซื้อวัตถุดิบ',
    questions: [
      'สถานะใบสั่งซื้อวัตถุดิบตอนนี้',
      'มีใบสั่งซื้อไหนที่ยังไม่ได้รับของ',
    ],
  },
  {
    key: 'charts',
    title: 'กราฟสรุป',
    questions: [
      'ขอกราฟสรุปสถานะโครงการ',
      'ขอกราฟความคืบหน้าของแต่ละเซกชัน',
    ],
  },
];

// First question of each group — the deterministic empty-state chips (one per group).
export const EMPTY_STATE_QUESTIONS = QUESTION_GROUPS.map((g) => g.questions[0]);
