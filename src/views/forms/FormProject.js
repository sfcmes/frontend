// [MES] FormProject — project list + create form + view/edit modal.
// Data logic identical to previous implementation; alert()/window.confirm → toast/ConfirmDialog.
import { useState, useEffect } from 'react';
import PageContainer from '../../components/container/PageContainer';
import FVProject from '../../components/forms/form-validation/FVProject';
import ProjectModal from './ProjectModal';
import api, { fetchProjects, createProject, updateProject, deleteProject } from 'src/utils/api';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { ConfirmDialog, EmptyState, useToast, CardHeader, Modal } from 'src/components/mes/ui';
import { Icon } from 'src/components/mes/Icon';
import { fmt, SEM_STATUS } from 'src/components/mes/status-meta';

const RowActions = ({ project, onEdit, onDelete }) => (
  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
    <button type="button" className="mes-btn mes-btn-ghost !min-h-touch md:!min-h-0 !px-2 !py-1.5" title="แก้ไข" aria-label="แก้ไข" onClick={() => onEdit(project)}><Icon name="edit" size={18} /></button>
    <button type="button" className="mes-btn mes-btn-danger !min-h-touch md:!min-h-0 !px-2 !py-1.5" title="ลบ" aria-label="ลบ" onClick={() => onDelete(project.id)}><Icon name="trash" size={18} /></button>
  </div>
);

const ProjectList = ({ projects, onView, onEdit, onDelete }) => (
  projects.length === 0 ? (
    <EmptyState icon="home-plus" title="ยังไม่มีโครงการ" />
  ) : (
    <>
      {/* base: cards */}
      <div className="flex flex-col gap-2 p-3 md:hidden">
        {projects.map((project) => (
          <div key={project.id} className="mes-card cursor-pointer p-3" onClick={() => onView(project)}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 grow">
                <div className="truncate text-sm font-semibold">{project.name}</div>
                <div className="font-mono text-xs text-mes-muted">{project.project_code}</div>
              </div>
              <StatusBadge status={project.status} kind="sem" />
            </div>
            <div className="mt-1.5 flex gap-4 text-xs text-mes-muted tabular-nums">
              <span>{fmt(project.sections)} ชั้น</span>
              <span>{fmt(project.components)} ชิ้นงาน</span>
            </div>
            <div className="mt-2">
              <RowActions project={project} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </div>
        ))}
      </div>
      {/* md+: table */}
      <div className="hidden md:block max-h-[440px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-mes-surface">
            <tr>
              <th className="mes-th">ชื่อโครงการ</th>
              <th className="mes-th">รหัสโครงการ</th>
              <th className="mes-th">สถานะ</th>
              <th className="mes-th text-right">ชั้น</th>
              <th className="mes-th text-right">ชิ้นงาน</th>
              <th className="mes-th text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="cursor-pointer even:bg-mes-surface-2/30 hover:bg-mes-surface-2" onClick={() => onView(project)}>
                <td className="mes-td font-semibold"><span className="block max-w-[220px] truncate">{project.name}</span></td>
                <td className="mes-td font-mono text-xs">{project.project_code}</td>
                <td className="mes-td"><StatusBadge status={project.status} kind="sem" /></td>
                <td className="mes-td text-right">{fmt(project.sections)}</td>
                <td className="mes-td text-right">{fmt(project.components)}</td>
                <td className="mes-td"><div className="flex justify-end"><RowActions project={project} onEdit={onEdit} onDelete={onDelete} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
);

const FormProject = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast, toastNode } = useToast();

  const q = query.trim().toLowerCase();
  const filteredProjects = projects.filter((p) =>
    (!q || `${p.name} ${p.project_code}`.toLowerCase().includes(q)) &&
    (!statusFilter || p.status === statusFilter));

  const fetchProjectsData = async () => {
    try {
      const token = localStorage.getItem('token');
      api.setToken(token);
      const response = await fetchProjects();
      setProjects(response.data);
    } catch (error) {
      showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
    }
  };

  useEffect(() => {
    fetchProjectsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddProject = async (newProject) => {
    try {
      const token = localStorage.getItem('token');
      api.setToken(token);
      await createProject(newProject);
      showToast('บันทึกโครงการแล้ว');
      fetchProjectsData();
    } catch (error) {
      showToast(`บันทึกไม่สำเร็จ: ${error.message}`, 'error');
    }
  };

  const handleCreateProject = async (newProject) => {
    await handleAddProject(newProject);
    setCreateOpen(false);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleUpdateProject = async (updatedProject) => {
    try {
      const token = localStorage.getItem('token');
      api.setToken(token);
      await updateProject(updatedProject.id, updatedProject);
      fetchProjectsData();
      setModalOpen(false);
      showToast('บันทึกการแก้ไขแล้ว');
    } catch (error) {
      showToast(`แก้ไขไม่สำเร็จ: ${error.message}`, 'error');
    }
  };

  const handleDeleteProject = async () => {
    const projectId = deleteId;
    setDeleteId(null);
    if (!projectId) return;
    try {
      const token = localStorage.getItem('token');
      api.setToken(token);
      await deleteProject(projectId);
      fetchProjectsData();
      showToast('ลบโครงการและข้อมูลที่เกี่ยวข้องทั้งหมดแล้ว');
    } catch (error) {
      showToast(`ลบไม่สำเร็จ: ${error.response?.data?.details || error.message}`, 'error');
    }
  };

  return (
    <PageContainer title="สร้างโครงการใหม่" description="This is the form to create a new project.">
      <div className="mes-card">
        <CardHeader
          title="ภาพรวมโครงการ"
          right={
            <button className="mes-btn mes-btn-primary" onClick={() => setCreateOpen(true)}>
              + สร้างโครงการใหม่
            </button>
          }
        />
        <div className="flex flex-col gap-2 border-b border-mes-border p-3 sm:flex-row sm:items-center">
          <input className="mes-input sm:flex-1" placeholder="ค้นหาชื่อหรือรหัสโครงการ" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="mes-input sm:w-52" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">ทุกสถานะ</option>
            {['planning', 'in_progress', 'completed', 'on_hold'].map((s) => <option key={s} value={s}>{SEM_STATUS[s].th}</option>)}
          </select>
          <span className="text-sm text-mes-muted sm:ml-1">แสดง {filteredProjects.length} จาก {projects.length}</span>
        </div>
        <ProjectList
          projects={filteredProjects}
          onView={handleViewProject}
          onEdit={handleEditProject}
          onDelete={(id) => setDeleteId(id)}
        />
      </div>
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="สร้างโครงการใหม่">
        <div className="p-1">
          <FVProject onAddProject={handleCreateProject} />
        </div>
      </Modal>
      <ProjectModal
        open={isModalOpen}
        project={selectedProject}
        onClose={() => setModalOpen(false)}
        onSave={handleUpdateProject}
        isEditing={isEditing}
      />
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteProject}
        title="ลบโครงการ"
        message="คุณแน่ใจว่าต้องการลบโครงการนี้และข้อมูลที่เกี่ยวข้องทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้"
        confirmLabel="ลบโครงการ"
        danger
      />
      {toastNode}
    </PageContainer>
  );
};

export default FormProject;
