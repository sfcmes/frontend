// [MES] ui — shared dark-UI primitives: Modal (bottom-sheet at base, dialog at md+),
// ConfirmDialog, Toast, EmptyState, Section header.
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${wide ? 'md:max-w-3xl' : 'md:max-w-lg'} max-h-[92dvh] flex flex-col bg-mes-surface border border-mes-border rounded-t-lg md:rounded-lg shadow-overlay`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 md:px-5 border-b border-mes-border shrink-0">
          <h2 className="text-lg font-semibold text-mes-text flex-1 min-w-0 truncate">{title}</h2>
          <button className="mes-btn mes-btn-ghost !min-h-touch !px-3" onClick={onClose} aria-label="ปิด">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 md:px-5 grow">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 py-3 md:px-5 border-t border-mes-border shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'ยืนยัน', danger = false, busy = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="mes-btn mes-btn-ghost" onClick={onClose} disabled={busy}>ยกเลิก</button>
          <button className={`mes-btn ${danger ? 'mes-btn-danger' : 'mes-btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'กำลังดำเนินการ…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-mes-text">{message}</p>
    </Modal>
  );
}

// Toast hook — one pattern app-wide.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const node = toast
    ? createPortal(
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium bg-mes-surface-2 shadow-overlay max-w-[92vw]"
          style={{
            borderColor: `var(${toast.tone === 'error' ? '--sem-danger' : toast.tone === 'warn' ? '--sem-warn' : '--sem-success'})`,
            color: 'var(--mes-text)',
          }}
        >
          <span style={{ color: `var(${toast.tone === 'error' ? '--sem-danger' : toast.tone === 'warn' ? '--sem-warn' : '--sem-success'})` }}>
            <Icon name={toast.tone === 'error' ? 'circle-x' : toast.tone === 'warn' ? 'alert-triangle' : 'circle-check'} size={17} />
          </span>
          {toast.message}
        </div>,
        document.body,
      )
    : null;

  return { showToast: show, toastNode: node };
}

export function EmptyState({ icon = 'box', title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
      <span className="text-mes-muted"><Icon name={icon} size={30} /></span>
      <div className="text-sm font-semibold text-mes-text">{title}</div>
      {hint && <div className="text-xs text-mes-muted max-w-xs">{hint}</div>}
      {action}
    </div>
  );
}

export function CardHeader({ title, sub, right }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-5 border-b border-mes-border">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-mes-text truncate">{title}</h2>
        {sub && <div className="text-xs text-mes-muted">{sub}</div>}
      </div>
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </div>
  );
}

export function Spinner({ label = 'กำลังโหลด…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-mes-muted text-sm">
      <span className="h-4 w-4 rounded-full border-2 border-mes-border border-t-mes-accent animate-spin" />
      {label}
    </div>
  );
}
