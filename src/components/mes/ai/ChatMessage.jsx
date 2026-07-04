// [MES] ChatMessage — one chat bubble + grounded charts + navigation link chips
import { useNavigate } from 'react-router-dom';
import { Icon } from 'src/components/mes/Icon';
import { ChatChart } from 'src/components/mes/ai/ChatChart';

// User bubbles sit right; assistant (and error) bubbles sit left with an avatar.
// Error bubbles reuse the semantic danger token (same one that colours toasts/
// mes-btn-danger) — NOT a workflow status colour, so the StatusBadge rule holds.
// Grounded chart/dataset payloads (F3) render below the bubble text via ChatChart;
// defensive optional-chaining means messages whose datasets were stripped from
// sessionStorage simply render no download chips.
export function ChatMessage({ message, onNavigate }) {
  const navigate = useNavigate();

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-br-sm bg-mes-surface-2 px-3.5 py-2.5 text-sm text-mes-text whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  const isError = Boolean(message.error);
  const links = message.links || [];

  return (
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 shrink-0 ${isError ? 'text-sem-danger' : 'text-mes-accent'}`}>
        <Icon name={isError ? 'alert-triangle' : 'message-chatbot'} size={20} />
      </span>
      <div className="min-w-0 max-w-[85%]">
        <div
          className={`rounded-lg rounded-bl-sm border bg-mes-surface px-3.5 py-2.5 text-sm text-mes-text whitespace-pre-wrap break-words ${
            isError ? 'border-sem-danger' : 'border-mes-border'
          }`}
        >
          {isError ? `⚠ ${message.content}` : message.content}
        </div>
        {!isError && <ChatChart charts={message.charts} datasets={message.datasets} />}
        {links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {links.map((link, i) => (
              <button
                key={`${link.path}-${i}`}
                type="button"
                className="mes-btn mes-btn-ghost text-xs"
                onClick={() => { onNavigate?.(); navigate(link.path); }}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
