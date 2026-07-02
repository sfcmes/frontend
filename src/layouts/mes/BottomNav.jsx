// [MES] BottomNav — phones (<md): fixed bottom bar, 4 slots + เมนู sheet.
// 48px touch targets throughout.
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Icon } from 'src/components/mes/Icon';
import { NAV_SECTIONS } from './nav';

const PRIMARY = [
  { id: 'dashboard', icon: 'aperture', title: 'ภาพรวม', path: '/dashboards/modern' },
  { id: 'qr-read', icon: 'scan', title: 'สแกน QR', path: '/forms/form-qr-code-reader' },
  { id: 'po', icon: 'file-invoice', title: 'ใบสั่งซื้อ', path: '/forms/form-po' },
];

export function BottomNav({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-mes-border bg-mes-surface pb-[env(safe-area-inset-bottom)]">
        {PRIMARY.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => go(item.path)}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-touch py-1.5 text-[11px] ${
                active ? 'text-mes-accent font-semibold' : 'text-mes-muted'
              }`}
            >
              <Icon name={item.icon} size={22} />
              {item.title}
            </button>
          );
        })}
        <button
          onClick={() => setMenuOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-touch py-1.5 text-[11px] ${menuOpen ? 'text-mes-accent font-semibold' : 'text-mes-muted'}`}
          aria-label="เมนู"
        >
          <Icon name="menu-2" size={22} />
          เมนู
        </button>
      </nav>

      {menuOpen &&
        createPortal(
          <div className="md:hidden fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setMenuOpen(false)}>
            <div
              className="w-full max-h-[80dvh] overflow-y-auto rounded-t-lg border border-mes-border bg-mes-surface pb-[env(safe-area-inset-bottom)]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center px-4 py-3 border-b border-mes-border">
                <span className="text-base font-semibold text-mes-text">เมนู</span>
                <button className="ml-auto p-3 text-mes-muted" onClick={() => setMenuOpen(false)} aria-label="ปิด">
                  <Icon name="x" size={20} />
                </button>
              </div>
              {NAV_SECTIONS.map((section) => (
                <div key={section.label} className="px-2 py-1">
                  <div className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-[0.14em] text-mes-muted">
                    {section.label}
                  </div>
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => go(item.path)}
                      className={`flex w-full items-center gap-3 rounded-sm px-3 min-h-touch text-sm text-left ${
                        location.pathname === item.path ? 'text-mes-accent font-semibold' : 'text-mes-text'
                      }`}
                    >
                      <Icon name={item.icon} size={20} />
                      {item.title}
                    </button>
                  ))}
                </div>
              ))}
              {user && (
                <div className="border-t border-mes-border px-2 py-2">
                  <button
                    onClick={() => { setMenuOpen(false); onLogout?.(); }}
                    className="flex w-full items-center gap-3 rounded-sm px-3 min-h-touch text-sm text-left text-sem-danger"
                  >
                    <Icon name="logout" size={20} />
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
