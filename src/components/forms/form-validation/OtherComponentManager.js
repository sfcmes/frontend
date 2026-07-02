// [MES] OtherComponentManager — edit/delete quantity-tracked "other" components.
// Data logic identical to previous implementation.
import { useState, useEffect, useContext } from 'react';
import {
  fetchProjects,
  updateOtherComponentDetails,
  deleteOtherComponentById,
  fetchOtherComponentsByProjectIdV2,
} from 'src/utils/api';
import { AuthContext } from 'src/contexts/AuthContext';
import { ConfirmDialog, useToast, EmptyState } from 'src/components/mes/ui';
import { StatusBadge } from 'src/components/mes/StatusBadge';

const OtherComponentManager = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedComponent, setEditedComponent] = useState({});
  const { showToast, toastNode } = useToast();

  useEffect(() => {
    fetchProjects().then((response) => setProjects(response.data));
  }, []);

  const handleProjectChange = async (projectId) => {
    setSelectedProject(projectId);
    setSelectedComponent(null);
    try {
      const projectComponents = await fetchOtherComponentsByProjectIdV2(projectId);
      setComponents(projectComponents);
    } catch {
      setComponents([]);
      showToast('เกิดข้อผิดพลาดในการดึงข้อมูลชิ้นส่วน', 'error');
    }
  };

  const handleUpdateComponent = async () => {
    try {
      if (!user || !user.id) {
        throw new Error('ไม่พบข้อมูลผู้ใช้');
      }
      const updatedComponent = await updateOtherComponentDetails(editedComponent.id, {
        ...editedComponent,
        updated_by: user.id,
        resetStatuses: editedComponent.total_quantity !== selectedComponent.total_quantity,
      });
      setComponents(components.map((c) => (c.id === updatedComponent.id ? updatedComponent : c)));
      setSelectedComponent(updatedComponent);
      setIsEditing(false);
      showToast('อัปเดตชิ้นส่วนสำเร็จ');
    } catch {
      showToast('เกิดข้อผิดพลาดในการอัปเดตชิ้นส่วน', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteOtherComponentById(selectedComponent.id);
      setComponents(components.filter((c) => c.id !== selectedComponent.id));
      setSelectedComponent(null);
      setIsDeleting(false);
      showToast('ลบชิ้นส่วนสำเร็จ');
    } catch {
      setIsDeleting(false);
      showToast('เกิดข้อผิดพลาดในการลบชิ้นส่วน', 'error');
    }
  };

  const editField = (name, label, parse = (v) => v) => (
    <div>
      <label className="mes-label" htmlFor={`ocm-${name}`}>{label}</label>
      <input
        id={`ocm-${name}`}
        className="mes-input"
        type={name === 'name' ? 'text' : 'number'}
        value={editedComponent[name] ?? ''}
        onChange={(e) => setEditedComponent({ ...editedComponent, [name]: parse(e.target.value) })}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mes-label" htmlFor="ocm-project">เลือกโครงการ</label>
        <select
          id="ocm-project"
          className="mes-input sm:max-w-md"
          value={selectedProject}
          onChange={(e) => handleProjectChange(e.target.value)}
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
            <button
              key={component.id}
              onClick={() => { setSelectedComponent(component); setEditedComponent({ ...component }); setIsEditing(false); }}
              className={`flex min-h-touch items-center gap-3 rounded-sm border px-3 py-2 text-left ${
                selectedComponent?.id === component.id ? 'border-mes-accent bg-mes-surface-2' : 'border-mes-border hover:bg-mes-surface-2'
              }`}
            >
              <span className="min-w-0 grow truncate text-sm font-medium">{component.name}</span>
              <span className="shrink-0 text-xs text-mes-muted tabular-nums">จำนวนทั้งหมด {component.total_quantity}</span>
            </button>
          ))}
        </div>
      )}

      {selectedComponent && (
        <div className="rounded-md border border-mes-border p-4">
          <div className="text-sm font-semibold">ชิ้นส่วนที่เลือก: {selectedComponent.name}</div>
          {isEditing ? (
            <div className="mt-3 flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {editField('name', 'ชื่อ')}
                {editField('total_quantity', 'จำนวนทั้งหมด', (v) => parseInt(v, 10))}
                {editField('width', 'ความกว้าง', (v) => parseFloat(v))}
                {editField('height', 'ความสูง', (v) => parseFloat(v))}
                {editField('thickness', 'ความหนา', (v) => parseFloat(v))}
              </div>
              <div className="flex gap-2">
                <button className="mes-btn mes-btn-primary" onClick={handleUpdateComponent}>บันทึกการเปลี่ยนแปลง</button>
                <button className="mes-btn mes-btn-ghost" onClick={() => setIsEditing(false)}>ยกเลิก</button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                <div><span className="text-mes-muted">จำนวนทั้งหมด:</span> <b className="tabular-nums">{selectedComponent.total_quantity}</b></div>
                <div><span className="text-mes-muted">ความกว้าง:</span> <b className="tabular-nums">{selectedComponent.width}</b></div>
                <div><span className="text-mes-muted">ความสูง:</span> <b className="tabular-nums">{selectedComponent.height}</b></div>
                <div><span className="text-mes-muted">ความหนา:</span> <b className="tabular-nums">{selectedComponent.thickness}</b></div>
              </div>
              <div className="mt-2 text-xs font-semibold text-mes-muted">สถานะ:</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {Object.entries(selectedComponent.statuses || {}).map(([status, quantity]) => (
                  <span key={status} className="inline-flex items-center gap-1.5">
                    <StatusBadge status={status} size="sm" />
                    <span className="text-sm tabular-nums">{quantity}</span>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="mes-btn mes-btn-ghost" onClick={() => setIsEditing(true)}>แก้ไข</button>
                <button className="mes-btn mes-btn-danger" onClick={() => setIsDeleting(true)}>ลบ</button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบชิ้นส่วนนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้"
        confirmLabel="ลบ"
        danger
      />
      {toastNode}
    </div>
  );
};

export default OtherComponentManager;
