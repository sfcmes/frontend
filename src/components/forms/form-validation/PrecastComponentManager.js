// [MES] PrecastComponentManager — edit/delete precast components per project.
// Fixes two latent crashes from the previous version: projects were never passed
// in as props (now fetched internally), and the components response is
// { precast[], other[] } (was .filter()'d as if an array). in_transit removed
// per CONTEXT.md decision 2026-07-02.
import { useState, useEffect } from 'react';
import { fetchProjects, fetchComponentsByProjectId, updateComponent, deleteComponent } from 'src/utils/api';
import { COMPONENT_STATUS, PIPE_ORDER } from 'src/components/mes/status-meta';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { ConfirmDialog, EmptyState, useToast } from 'src/components/mes/ui';

const PrecastComponentManager = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast, toastNode } = useToast();

  useEffect(() => {
    fetchProjects()
      .then((res) => setProjects(res.data || []))
      .catch(() => setProjects([]));
  }, []);

  const handleProjectSelect = async (projectId) => {
    setSelectedProject(projectId);
    setSelectedComponent(null);
    setIsEditing(false);
    try {
      const res = await fetchComponentsByProjectId(projectId);
      setComponents(Array.isArray(res?.precast) ? res.precast : (Array.isArray(res) ? res : []));
    } catch {
      setComponents([]);
      showToast('เกิดข้อผิดพลาดในการดึงข้อมูลชิ้นงาน', 'error');
    }
  };

  const handleUpdateComponent = async (values) => {
    try {
      const updatedComponent = await updateComponent(selectedComponent.id, values);
      setComponents(components.map((c) => (c.id === updatedComponent.id ? updatedComponent : c)));
      showToast('อัปเดตชิ้นงานสำเร็จ');
      setIsEditing(false);
    } catch {
      showToast('เกิดข้อผิดพลาดในการอัปเดตชิ้นงาน', 'error');
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    try {
      await deleteComponent(target.id);
      setComponents(components.filter((c) => c.id !== target.id));
      if (selectedComponent?.id === target.id) setSelectedComponent(null);
      showToast('ลบชิ้นงานสำเร็จ');
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบชิ้นงาน', 'error');
    }
  };

  const editField = (name, label) => (
    <div>
      <label className="mes-label" htmlFor={`pcm-${name}`}>{label}</label>
      <input
        id={`pcm-${name}`}
        className="mes-input"
        type={name === 'name' ? 'text' : 'number'}
        value={selectedComponent[name] ?? ''}
        onChange={(e) => setSelectedComponent({ ...selectedComponent, [name]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mes-label" htmlFor="pcm-project">โครงการ</label>
        <select
          id="pcm-project"
          className="mes-input sm:max-w-md"
          value={selectedProject}
          onChange={(e) => handleProjectSelect(e.target.value)}
        >
          <option value="">—</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>

      {components.length === 0 ? (
        selectedProject && <EmptyState icon="box" title="ไม่พบชิ้นงานในโครงการนี้" />
      ) : (
        <div className="flex flex-col gap-1.5">
          {components.map((component) => (
            <div
              key={component.id}
              className="flex min-h-touch flex-wrap items-center gap-2 rounded-sm border border-mes-border px-3 py-2"
            >
              <div className="min-w-0 grow">
                <div className="truncate text-sm font-medium">{component.name}</div>
                <div className="text-xs text-mes-muted tabular-nums">
                  ขนาด (กxยxส) {component.width}x{component.height}x{component.thickness}
                </div>
              </div>
              <StatusBadge status={component.status} size="sm" />
              <div className="flex gap-1.5">
                <button
                  className="mes-btn mes-btn-ghost !min-h-touch md:!min-h-0 md:!py-1.5 text-xs"
                  onClick={() => { setSelectedComponent(component); setIsEditing(true); }}
                >
                  แก้ไข
                </button>
                <button
                  className="mes-btn mes-btn-danger !min-h-touch md:!min-h-0 md:!py-1.5 text-xs"
                  onClick={() => setDeleteTarget(component)}
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && selectedComponent && (
        <form
          className="rounded-md border border-mes-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateComponent(selectedComponent);
          }}
        >
          <div className="text-sm font-semibold">แก้ไขชิ้นงาน: {selectedComponent.name}</div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {editField('name', 'ชื่อชิ้นงาน')}
            {editField('width', 'ความกว้าง (มม.)')}
            {editField('height', 'ความสูง (มม.)')}
            {editField('thickness', 'ความหนา (มม.)')}
            <div>
              <label className="mes-label" htmlFor="pcm-status">สถานะ</label>
              <select
                id="pcm-status"
                className="mes-input"
                value={selectedComponent.status}
                onChange={(e) => setSelectedComponent({ ...selectedComponent, status: e.target.value })}
              >
                {PIPE_ORDER.map((k) => (
                  <option key={k} value={k}>{COMPONENT_STATUS[k].th}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="mes-btn mes-btn-primary">บันทึกการเปลี่ยนแปลง</button>
            <button type="button" className="mes-btn mes-btn-ghost" onClick={() => setIsEditing(false)}>ยกเลิก</button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบชิ้นงานนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้"
        confirmLabel="ลบ"
        danger
      />
      {toastNode}
    </div>
  );
};

export default PrecastComponentManager;
