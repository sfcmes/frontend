// [MES] AiChatPanel — floating button + slide-over chat panel; locked for guests (ADR-0003)
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import { Icon } from 'src/components/mes/Icon';
import { useAiChat } from './useAiChat';
import { ChatConversation } from './ChatConversation';
import { AiLockedState } from './AiLockedState';

// Logged-in body — owns its own useAiChat instance. The sessionStorage key is
// shared with AiChatPage, so history follows the user between panel and page.
// Split into its own component so the hook (and its network calls) never mount
// for guests.
function AuthedPanelBody({ onNavigate }) {
  const { messages, pending, send } = useAiChat();
  return <ChatConversation messages={messages} pending={pending} onSend={send} onNavigate={onNavigate} />;
}

export function AiChatPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  // Escape-to-close + body scroll lock while the panel is open (mirrors Modal).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  // Auth state still resolving — render nothing (avoids a guest flash).
  if (loading) return null;

  const openFullPage = () => {
    navigate('/ai/chat');
    close();
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="ผู้ช่วย AI"
          className="fixed z-40 right-4 bottom-20 md:bottom-6 h-12 w-12 flex items-center justify-center rounded-full bg-mes-accent text-mes-accent-ink shadow-overlay"
        >
          <Icon name="message-chatbot" size={24} />
        </button>
      )}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/60" onClick={close}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="ผู้ช่วย AI"
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-0 h-[85dvh] rounded-t-xl flex flex-col bg-mes-surface border-t border-mes-border shadow-overlay md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[400px] md:rounded-none md:border-t-0 md:border-l"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-mes-border shrink-0">
                <h2 className="text-lg font-semibold text-mes-text flex-1 min-w-0 truncate">ผู้ช่วย AI</h2>
                {user && (
                  <button type="button" className="mes-btn mes-btn-ghost text-xs" onClick={openFullPage}>
                    เปิดแบบเต็มหน้า
                  </button>
                )}
                <button
                  type="button"
                  className="mes-btn mes-btn-ghost !min-h-touch !px-3"
                  onClick={close}
                  aria-label="ปิด"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>

              {user ? <AuthedPanelBody onNavigate={close} /> : <AiLockedState />}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
