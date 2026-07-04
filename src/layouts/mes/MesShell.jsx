// [MES] MesShell — the app shell for every MES page (ADR-0005).
// Dark-only. Sidebar at md+, BottomNav below md, breadcrumb topbar.
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { SfcMark } from './Logo';
import { pageTitle } from './nav';
import { AiChatPanel } from 'src/components/mes/ai/AiChatPanel';

const MesShell = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = pageTitle(location.pathname);

  return (
    <div className="flex h-dvh bg-mes-bg text-mes-text">
      <Sidebar user={user} onLogout={logout} />

      <div className="flex min-w-0 grow flex-col">
        <header className="flex items-center gap-2 border-b border-mes-border bg-mes-surface px-4 py-2.5 md:px-5">
          <span className="md:hidden"><SfcMark size={24} /></span>
          <span className="text-xs text-mes-muted hidden sm:inline">SFC MES</span>
          {title && (
            <>
              <span className="text-mes-muted hidden sm:inline">›</span>
              <span className="truncate text-sm font-semibold">{title}</span>
            </>
          )}
        </header>

        <main className="min-h-0 grow overflow-y-auto px-3 py-3 md:px-5 md:py-4 pb-20 md:pb-4">
          <Outlet context={{ user }} />
        </main>
      </div>

      <BottomNav user={user} onLogout={logout} />
      <AiChatPanel />
    </div>
  );
};

export default MesShell;
