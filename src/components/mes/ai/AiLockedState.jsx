// [MES] AiLockedState — guest lock overlay with skeleton (ADR-0003)
import { useNavigate } from 'react-router-dom';
import { Icon } from 'src/components/mes/Icon';

// Default skeleton: 3 chat-bubble-shaped pulse blocks, alternating left/right,
// so guests see the outline of real content beneath the overlay (ADR-0003).
function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4" aria-hidden="true">
      <div className="flex justify-start">
        <div className="h-12 w-3/5 rounded-lg rounded-bl-sm bg-mes-surface-2 animate-pulse" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-2/5 rounded-lg rounded-br-sm bg-mes-surface-2 animate-pulse" />
      </div>
      <div className="flex justify-start">
        <div className="h-16 w-3/4 rounded-lg rounded-bl-sm bg-mes-surface-2 animate-pulse" />
      </div>
    </div>
  );
}

// Reusable guest lock (ADR-0003): skeleton beneath a blur+dark overlay whose
// SURFACE is not clickable — only the lock icon, prompt text, and the login
// button navigate, preventing accidental redirects on the scroll-heavy public
// dashboard. F4 reuses this around insight cards via the message/skeleton props.
export function AiLockedState({ message = 'เข้าสู่ระบบเพื่อใช้งานผู้ช่วย AI', skeleton }) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-0 grow overflow-hidden">
      {skeleton ?? <DefaultSkeleton />}

      <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center gap-3 px-6 text-center">
          <span className="text-mes-muted"><Icon name="lock" size={30} /></span>
          <p className="text-sm font-medium text-mes-text max-w-xs">{message}</p>
          <button
            type="button"
            className="mes-btn mes-btn-primary"
            onClick={() => navigate('/auth/login')}
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
