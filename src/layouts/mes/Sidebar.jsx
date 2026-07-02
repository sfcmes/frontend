// [MES] Sidebar — md: icon rail that expands on hover/tap; lg+: always expanded.
// Hidden below md (BottomNav takes over).
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from 'src/components/mes/Icon';
import { SfcMark, BrandWord } from './Logo';
import { NAV_SECTIONS } from './nav';

export function Sidebar({ user, onLogout }) {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user ? (user.name || user.username || 'U').slice(0, 2).toUpperCase() : '—';
  const displayName = user ? (user.name || user.username || 'ผู้ใช้งาน') : 'ยังไม่ได้เข้าสู่ระบบ';
  const role = user ? (user.role || 'User') : null;

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r border-mes-border bg-mes-surface transition-[width] duration-150 ${hover ? 'md:w-60' : 'md:w-[72px]'} lg:w-60 overflow-hidden`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <SfcMark size={30} />
        <span className={`${hover ? 'opacity-100' : 'opacity-0'} lg:opacity-100 transition-opacity`}>
          <BrandWord />
        </span>
      </div>

      <nav className="grow overflow-y-auto px-2 pb-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className={`px-2 pt-4 pb-1 text-[10px] font-semibold tracking-[0.14em] text-mes-muted whitespace-nowrap ${hover ? 'opacity-100' : 'opacity-0'} lg:opacity-100`}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  title={item.title}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-sm px-3 py-2.5 my-0.5 text-sm text-left transition-colors ${
                    active
                      ? 'bg-mes-accent text-mes-accent-ink font-semibold'
                      : 'text-mes-muted hover:bg-mes-surface-2 hover:text-mes-text'
                  }`}
                >
                  <span className="shrink-0"><Icon name={item.icon} size={20} /></span>
                  <span className={`truncate whitespace-nowrap ${hover ? 'opacity-100' : 'opacity-0'} lg:opacity-100 transition-opacity`}>
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-mes-border px-3 py-3 flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-mes-accent text-mes-accent-ink flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <div className={`min-w-0 grow ${hover ? 'opacity-100' : 'opacity-0'} lg:opacity-100 transition-opacity`}>
          <div className="truncate text-sm font-semibold text-mes-text">{displayName}</div>
          {role && <div className="truncate text-xs text-mes-muted">{role}</div>}
        </div>
        {user && (
          <button
            onClick={onLogout}
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            className={`shrink-0 text-mes-muted hover:text-sem-danger p-2 ${hover ? 'opacity-100' : 'opacity-0'} lg:opacity-100`}
          >
            <Icon name="logout" size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}
