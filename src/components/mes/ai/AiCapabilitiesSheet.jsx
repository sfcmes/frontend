// [MES] AiCapabilitiesSheet — modal listing what the AI can answer, grouped by topic;
// tapping a question asks it. Stateless; parent owns open/close state.
import { Modal } from 'src/components/mes/ui';
import { QUESTION_GROUPS } from './questionBank';

export function AiCapabilitiesSheet({ open, onClose, onAsk }) {
  return (
    <Modal open={open} onClose={onClose} title="ผู้ช่วย AI ทำอะไรได้บ้าง">
      <div className="flex flex-col gap-5">
        {QUESTION_GROUPS.map((group) => (
          <div key={group.key} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-mes-text">{group.title}</h3>
            <div className="flex flex-col gap-2">
              {group.questions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="mes-btn mes-btn-ghost !min-h-touch justify-start text-left text-sm"
                  onClick={() => onAsk(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="text-xs text-mes-muted">
          AI ตอบพร้อมกราฟ ลิงก์ไปหน้าที่เกี่ยวข้อง และไฟล์ Excel ได้
        </p>
      </div>
    </Modal>
  );
}
