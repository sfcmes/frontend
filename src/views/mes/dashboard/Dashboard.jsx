// [MES] Dashboard — public MES dashboard page (/dashboards/modern).
// Data flow identical to the previous ModernDashboard implementation.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Hero } from './Hero';
import { ProjectTable } from './ProjectTable';
import { RightPanel } from './RightPanel';
import { ProjectDrawer } from './Drawer';
import { transformProjectBasic, buildStatusFromComponents, aggregateStatus } from './data';
import { fetchProjects, fetchUserProjects, fetchComponentsByProjectId } from 'src/utils/api';

const Dashboard = () => {
  const { user } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [userProjects, setUserProjects] = useState([]);

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
            })),
          ),
        );
        setProjects(results.map((r, i) => (r.status === 'fulfilled' ? r.value : basics[i])));
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

  const agg = useMemo(() => {
    if (selected) return { counts: selected.status, total: selected.total };
    return aggregateStatus(projects);
  }, [selected, projects]);

  const handleSelect = (project) => setSelected(project);
  const handleOpen = (project) => {
    setSelected(project);
    setDrawer(project);
  };

  const handleDataLoaded = (enriched) => {
    setSelected(enriched);
    setDrawer((prev) => (prev?.id === enriched.id ? enriched : prev));
  };

  const handleStatusUpdated = useCallback(async (projectId) => {
    try {
      const compRes = await fetchComponentsByProjectId(projectId);
      const newStatus = buildStatusFromComponents(compRes);
      setProjects((prev) =>
        prev.map((p) => (String(p.id) === String(projectId) ? { ...p, status: newStatus } : p)),
      );
      setSelected((prev) =>
        prev && String(prev.id) === String(projectId) ? { ...prev, status: newStatus } : prev,
      );
    } catch {
      // stale counts are preferable to an error state
    }
  }, []);

  const canEdit = (projectId) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (user.role === 'Site User') return userProjects.includes(String(projectId));
    return false;
  };

  return (
    <>
      <Hero
        agg={agg}
        projectCount={selected ? 1 : projects.length}
        scope={selected ? selected.name : 'ทุกโครงการ'}
        onReset={selected ? () => setSelected(null) : null}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ProjectTable
          projects={projects}
          selectedId={selected?.id}
          userRole={user?.role ?? null}
          onSelect={handleSelect}
          onOpen={handleOpen}
        />
        <RightPanel project={selected} userRole={user?.role ?? null} onOpen={handleOpen} />
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
    </>
  );
};

export default Dashboard;
