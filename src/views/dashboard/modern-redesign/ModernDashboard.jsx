import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './styles.css';
import { Sidebar } from './Sidebar';
import { Hero } from './Hero';
import { ProjectTable } from './Table';
import { RightPanel } from './RightPanel';
import { ProjectDrawer } from './Drawer';
import { TweaksPanel } from './TweaksPanel';
import { aggregateStatus, transformProjectBasic, buildStatusFromComponents } from './utils';
import { fetchProjects, fetchUserProjects, fetchComponentsByProjectId } from 'src/utils/api';
import { useAuth } from 'src/contexts/AuthContext';

const TWEAK_DEFAULTS = { viz: 'bar', accent: '#3D5A80', bg: 'sky', density: 3 };

function loadTweaks() {
  try {
    const stored = localStorage.getItem('mes-tweaks');
    return stored ? { ...TWEAK_DEFAULTS, ...JSON.parse(stored) } : TWEAK_DEFAULTS;
  } catch {
    return TWEAK_DEFAULTS;
  }
}

const ModernDashboard = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [tweaks, setTweaks] = useState(loadTweaks);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // Fetch all projects on mount, then enrich status counts from real component data
  useEffect(() => {
    fetchProjects()
      .then(async (res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const basics = data.map(transformProjectBasic);
        setProjects(basics);

        const results = await Promise.allSettled(
          basics.map((proj) =>
            fetchComponentsByProjectId(proj.id).then((compRes) => ({
              ...proj,
              status: buildStatusFromComponents(compRes),
            }))
          )
        );
        setProjects(
          results.map((r, i) => (r.status === 'fulfilled' ? r.value : basics[i]))
        );
      })
      .catch(() => setProjects([]));
  }, []);

  // Fetch assigned project IDs for Site User role
  useEffect(() => {
    if (user?.role === 'Site User') {
      fetchUserProjects(user.id)
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setUserProjects(list.map((p) => String(p.id)));
        })
        .catch(() => setUserProjects([]));
    } else {
      setUserProjects([]);
    }
  }, [user?.id, user?.role]);

  // Persist tweaks to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('mes-tweaks', JSON.stringify(tweaks));
    } catch { /* ignore quota errors */ }
  }, [tweaks]);

  // Aggregate stats: single project when selected, all projects otherwise
  const agg = useMemo(() => {
    if (selected) return { counts: selected.status, total: selected.total };
    return aggregateStatus(projects);
  }, [selected, projects]);

  const handleSelect = (project) => setSelected(project);

  const handleOpen = (project) => {
    setSelected(project);
    setDrawer(project);
  };

  // Drawer calls this after fetching real section/component data
  const handleDataLoaded = (enriched) => {
    setSelected(enriched);
    setDrawer((prev) => (prev?.id === enriched.id ? enriched : prev));
  };

  const handleStatusUpdated = useCallback(async (projectId) => {
    try {
      const compRes = await fetchComponentsByProjectId(projectId);
      const newStatus = buildStatusFromComponents(compRes);
      setProjects((prev) =>
        prev.map((p) => (String(p.id) === String(projectId) ? { ...p, status: newStatus } : p))
      );
      setSelected((prev) =>
        prev && String(prev.id) === String(projectId) ? { ...prev, status: newStatus } : prev
      );
    } catch {
      // silently ignore — stale counts are preferable to an error state
    }
  }, []);

  const canEdit = (projectId) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (user.role === 'Site User') return userProjects.includes(String(projectId));
    return false;
  };

  return (
    <div className="mes-app" data-bg={tweaks.bg} style={{ '--accent': tweaks.accent }}>
      <Sidebar
        collapsed={false}
        accent={tweaks.accent}
        user={user}
        onLogout={logout}
      />

      <div className="mes-main">
        <Hero
          agg={agg}
          viz={tweaks.viz}
          accent={tweaks.accent}
          projectCount={selected ? 1 : projects.length}
          scope={selected ? selected.name : 'ทุกโครงการ'}
          onReset={selected ? () => setSelected(null) : null}
        />
        <div className="mes-work">
          <ProjectTable
            projects={projects}
            accent={tweaks.accent}
            density={tweaks.density}
            selectedId={selected?.id}
            userRole={user?.role ?? null}
            onSelect={handleSelect}
            onOpen={handleOpen}
          />
          <RightPanel project={selected} userRole={user?.role ?? null} onOpen={handleOpen} />
        </div>
      </div>

      {drawer && (
        <ProjectDrawer
          project={drawer}
          onClose={() => setDrawer(null)}
          onDataLoaded={handleDataLoaded}
          onStatusUpdated={handleStatusUpdated}
          canEdit={canEdit(drawer.id)}
        />
      )}

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

export default ModernDashboard;
