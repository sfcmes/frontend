// [MES] AiChatPanel — floating button + slide-over chat panel; locked for guests (ADR-0003)
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import { Icon } from 'src/components/mes/Icon';
import { useAiChat } from './useAiChat';
import { ChatConversation } from './ChatConversation';
import { AiLockedState } from './AiLockedState';

// Slide-over shell — backdrop + panel + header chrome, portalled to body.
// Shared by the authed chat and the guest locked state so both render the
// exact same chrome (aria labels, z-classes, close button).
function PanelShell({ onClose, headerExtra, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ผู้ช่วย AI"
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-0 h-[85dvh] rounded-t-xl flex flex-col bg-mes-surface border-t border-mes-border shadow-overlay md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[400px] md:rounded-none md:border-t-0 md:border-l"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-mes-border shrink-0">
          <h2 className="text-lg font-semibold text-mes-text flex-1 min-w-0 truncate">ผู้ช่วย AI</h2>
          {headerExtra}
          <button
            type="button"
            className="mes-btn mes-btn-ghost !min-h-touch !px-3"
            onClick={onClose}
            aria-label="ปิด"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}

// Logged-in chat — owns the useAiChat instance. Mounted PERSISTENTLY (not only
// while the panel is open) so the hook stays alive across open/close: a reply
// still in flight when the user closes the panel is appended and persisted to
// sessionStorage instead of being dropped by an unmount. Only the panel chrome
// is conditional on `open`. The sessionStorage key is shared with AiChatPage,
// so history follows the user between panel and page. Split into its own
// component so the hook (and its network calls) never mounts for guests.
function AuthedChat({ open, onClose, onOpenFullPage }) {
  const { messages, pending, send } = useAiChat();

  if (!open) return null;

  return (
    <PanelShell
      onClose={onClose}
      headerExtra={
        <button type="button" className="mes-btn mes-btn-ghost text-xs" onClick={onOpenFullPage}>
          เปิดแบบเต็มหน้า
        </button>
      }
    >
      <ChatConversation messages={messages} pending={pending} onSend={send} onNavigate={onClose} />
    </PanelShell>
  );
}

export function AiChatPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  // On /ai/chat the full-page chat owns the conversation — mounting the panel's
  // hook there too would create a second sessionStorage writer (last-write-wins
  // clobbers history). Reset `open` so body-lock and panel state never linger.
  const onChatPage = location.pathname === '/ai/chat';
  useEffect(() => {
    if (onChatPage) setOpen(false);
  }, [onChatPage]);

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

  // Full-page chat route: no launcher, no panel, no second chat instance.
  if (onChatPage) return null;

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

      {user ? (
        <AuthedChat open={open} onClose={close} onOpenFullPage={openFullPage} />
      ) : (
        open && (
          <PanelShell onClose={close}>
            <AiLockedState />
          </PanelShell>
        )
      )}
    </>
  );
}
