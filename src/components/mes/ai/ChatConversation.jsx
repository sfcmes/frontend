// [MES] ChatConversation — message list, typing indicator, input row
import { useEffect, useRef, useState } from 'react';
import { Icon } from 'src/components/mes/Icon';
import { EmptyState } from 'src/components/mes/ui';
import { ChatMessage } from './ChatMessage';
import { EMPTY_STATE_QUESTIONS } from './questionBank';

// Assistant-style bubble shown while the backend tool loop runs.
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-mes-accent"><Icon name="message-chatbot" size={20} /></span>
      <div className="rounded-lg rounded-bl-sm border border-mes-border bg-mes-surface px-3.5 py-3">
        <div className="flex gap-1.5" aria-label="กำลังพิมพ์">
          <span className="h-2 w-2 rounded-full bg-mes-muted animate-pulse" />
          <span className="h-2 w-2 rounded-full bg-mes-muted animate-pulse" style={{ animationDelay: '0.15s' }} />
          <span className="h-2 w-2 rounded-full bg-mes-muted animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}

// The chat state hook lives in the PARENT (page or floating panel) so this
// component can be reused inside F2's panel — it only receives props.
export function ChatConversation({ messages, pending, onSend, onNavigate }) {
  const scrollRef = useRef(null);
  const [draft, setDraft] = useState('');

  // Auto-scroll to the newest message / typing indicator.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const submit = () => {
    const text = draft.trim();
    if (!text || pending) return;
    onSend(text);
    setDraft('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isEmpty = messages.length === 0;

  // Follow-up chips — only under the LATEST reply, never on errors, hidden while
  // the next answer is in flight (a new user message makes them vanish naturally).
  const last = messages[messages.length - 1];
  const followUps =
    !pending && last && last.role === 'assistant' && !last.error && Array.isArray(last.suggestions)
      ? last.suggestions
      : [];

  return (
    <div className="flex min-h-0 grow flex-col">
      <div ref={scrollRef} className="min-h-0 grow overflow-y-auto px-3 py-4 md:px-5">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center">
            <EmptyState
              icon="message-chatbot"
              title="เริ่มถามผู้ช่วย AI"
              hint="ถามเกี่ยวกับความคืบหน้าโครงการ ใบสั่งซื้อวัตถุดิบ หรือชิ้นงานที่ถูกปฏิเสธ"
            />
            <div className="mt-1 flex flex-wrap justify-center gap-2 px-2">
              {EMPTY_STATE_QUESTIONS.map((s) => (
                <button key={s} type="button" className="mes-btn mes-btn-ghost text-xs" onClick={() => onSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} onNavigate={onNavigate} />
            ))}
            {pending && <TypingIndicator />}
            {followUps.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-7">
                {followUps.map((s) => (
                  <button key={s} type="button" className="mes-btn mes-btn-ghost text-xs" onClick={() => onSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-mes-border px-3 py-3 md:px-5 shrink-0">
        <input
          className="mes-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={pending}
          placeholder="พิมพ์คำถามเกี่ยวกับการผลิต…"
          aria-label="พิมพ์คำถามเกี่ยวกับการผลิต"
        />
        <button
          type="button"
          className="mes-btn mes-btn-primary shrink-0"
          onClick={submit}
          disabled={pending || !draft.trim()}
          aria-label="ส่งข้อความ"
        >
          <Icon name="send" size={18} />
        </button>
      </div>
    </div>
  );
}
