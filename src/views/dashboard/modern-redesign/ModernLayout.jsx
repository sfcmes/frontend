import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import './styles.css';
import { Sidebar, NAV } from './Sidebar';
import { TweaksPanel } from './TweaksPanel';
import { Icon } from './Primitives';
import { useAuth } from 'src/contexts/AuthContext';

const TWEAK_DEFAULTS = { viz: 'bar', accent: '#3D5A80', bg: 'sky', density: 3, theme: 'light' };

function loadTweaks() {
  try {
    const stored = localStorage.getItem('mes-tweaks');
    return stored ? { ...TWEAK_DEFAULTS, ...JSON.parse(stored) } : TWEAK_DEFAULTS;
  } catch {
    return TWEAK_DEFAULTS;
  }
}

function usePageTitle(pathname) {
  const item = NAV.find((n) => n.path && n.path === pathname);
  return item ? item.title : null;
}

const ModernLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [tweaks, setTweaks] = useState(loadTweaks);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const isDashboard = location.pathname === '/dashboards/modern';
  const pageTitle = usePageTitle(location.pathname);

  useEffect(() => {
    try {
      localStorage.setItem('mes-tweaks', JSON.stringify(tweaks));
    } catch { /* ignore quota errors */ }
  }, [tweaks]);

  return (
    <div className="mes-app" data-bg={tweaks.bg} data-theme={tweaks.theme} style={{ '--accent': tweaks.accent }}>
      <Sidebar
        collapsed={false}
        accent={tweaks.accent}
        user={user}
        onLogout={logout}
      />

      <div className="mes-main">
        {isDashboard ? (
          <Outlet context={{ tweaks, user }} />
        ) : (
          <>
            <div className="mes-topbar">
              <div className="tb-crumb">
                <span className="tb-crumb-root">SFC MES</span>
                <span style={{ color: 'var(--ink3)' }}>›</span>
                <span className="tb-crumb-cur">{pageTitle || 'Page'}</span>
              </div>
              <span style={{ flex: 1 }} />
              <button
                className="tb-ic"
                title={tweaks.theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
                onClick={() => setTweaks((t) => ({ ...t, theme: t.theme === 'dark' ? 'light' : 'dark' }))}
              >
                <Icon name={tweaks.theme === 'dark' ? 'sun' : 'moon'} size={18} />
              </button>
            </div>
            <div className="mes-scroll">
              <div style={{ padding: '20px 22px' }}>
                <Outlet context={{ tweaks, user }} />
              </div>
            </div>
          </>
        )}
      </div>

      <TweaksPanel
        tweaks={tweaks}
        onChange={setTweaks}
        open={tweaksOpen}
        onClose={() => setTweaksOpen(false)}
      />

      <button
        className="mes-tweaks-fab"
        onClick={() => setTweaksOpen((o) => !o)}
        title="Tweaks"
        style={{ '--accent': tweaks.accent }}
      >
        ⚙
      </button>
    </div>
  );
};

export default ModernLayout;
