// [MES] FormSection — section (ชั้น) list + create form + edit modal.
// Data logic identical to previous implementation.
import { useState, useEffect } from 'react';
import PageContainer from '../../components/container/PageContainer';
import EditSectionModal from './EditSectionModal';
import FVSection from '../../components/forms/form-validation/FVSection';
import api, { createSection, updateSection, deleteSection } from '../../utils/api';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { ConfirmDialog, EmptyState, useToast, CardHeader, Modal } from 'src/components/mes/ui';
import { Icon } from 'src/components/mes/Icon';
import { fmt, SEM_STATUS } from 'src/components/mes/status-meta';

const SectionList = ({ sections, onView, onEdit, onDelete }) => (
  sections.length === 0 ? (
    <EmptyState icon="brand-codepen" title="ยังไม่มีข้อมูลชั้น" />
  ) : (
    <>
      {/* base: cards */}
      <div className="flex flex-col gap-2 p-3 md:hidden">
        {sections.map((section) => (
          <div key={section.id} className="mes-card cursor-pointer p-3" onClick={() => onView(section)}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 grow">
                <div className="truncate text-sm font-semibold">{section.name}</div>
                <div className="truncate text-xs text-mes-muted">{section.project_name}</div>
              </div>
              <StatusBadge status={section.status} kind="sem" />
            </div>
            <div className="mt-1.5 text-xs text-mes-muted tabular-nums">{fmt(section.components)} ชิ้นงาน</div>
            <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="mes-btn mes-btn-ghost !min-h-touch !px-3 text-xs" title="แก้ไข" aria-label="แก้ไข" onClick={() => onEdit(section)}><Icon name="edit" size={18} /></button>
              <button type="button" className="mes-btn mes-btn-danger !min-h-touch !px-3 text-xs" title="ลบ" aria-label="ลบ" onClick={() => onDelete(section.id)}><Icon name="trash" size={18} /></button>
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
              <th className="mes-th">ชั้น</th>
              <th className="mes-th">สถานะ</th>
              <th className="mes-th text-right">ชิ้นงาน</th>
              <th className="mes-th text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.id} className="cursor-pointer even:bg-mes-surface-2/30 hover:bg-mes-surface-2" onClick={() => onView(section)}>
                <td className="mes-td"><span className="block max-w-[200px] truncate">{section.project_name}</span></td>
                <td className="mes-td font-semibold">{section.name}</td>
                <td className="mes-td"><StatusBadge status={section.status} kind="sem" /></td>
                <td className="mes-td text-right">{fmt(section.components)}</td>
                <td className="mes-td">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="mes-btn mes-btn-ghost !min-h-0 !px-2 !py-1.5" title="แก้ไข" aria-label="แก้ไข" onClick={() => onEdit(section)}><Icon name="edit" size={18} /></button>
                    <button type="button" className="mes-btn mes-btn-danger !min-h-0 !px-2 !py-1.5" title="ลบ" aria-label="ลบ" onClick={() => onDelete(section.id)}><Icon name="trash" size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
);

const FormSection = () => {
  const [sections, setSections] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalEditing, setModalEditing] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showToast, toastNode } = useToast();

  const q = query.trim().toLowerCase();
  const filteredSections = sections.filter((s) =>
    (!q || `${s.project_name} ${s.name}`.toLowerCase().includes(q)) &&
    (!statusFilter || s.status === statusFilter));

  const fetchSections = async () => {
    try {
      const response = await api.get('/sections');
      const data = response.data;
      const sortedSections = data.sort((a, b) => {
        if (a.project_name < b.project_name) return -1;
        if (a.project_name > b.project_name) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
      setSections(sortedSections);
    } catch (error) {
      showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
    }
  };

  useEffect(() => {
    fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSection = async (newSection) => {
    try {
      await createSection(newSection);
      showToast('บันทึกชั้นแล้ว');
      fetchSections();
    } catch (error) {
      showToast('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const handleCreateSection = async (newSection) => {
    await handleAddSection(newSection);
    setCreateOpen(false);
  };

  const handleEditSection = async (updatedSection) => {
    try {
      await updateSection(updatedSection.id, updatedSection);
      fetchSections();
      setIsEditModalOpen(false);
      showToast('บันทึกการแก้ไขแล้ว');
    } catch (error) {
      showToast('แก้ไขไม่สำเร็จ', 'error');
    }
  };

  const handleDeleteSection = async () => {
    const sectionId = deleteId;
    setDeleteId(null);
    if (!sectionId) return;
    try {
      await deleteSection(sectionId);
      fetchSections();
      showToast('ลบชั้นแล้ว');
    } catch (error) {
      showToast('ลบไม่สำเร็จ', 'error');
    }
  };

  return (
    <PageContainer title="สร้างชั้นของแต่ละโครงการ" description="this is Form create new project page">
      <div className="mes-card self-start">
        <CardHeader
          title="ภาพรวมแต่ละชั้นของแต่ละโครงการ"
          right={<button className="mes-btn mes-btn-primary" onClick={() => setCreateOpen(true)}>+ สร้างชั้นใหม่</button>}
        />
        <div className="flex flex-col gap-2 border-b border-mes-border p-3 sm:flex-row sm:items-center">
          <input className="mes-input sm:flex-1" placeholder="ค้นหาชื่อโครงการหรือชั้น" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="mes-input sm:w-52" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">ทุกสถานะ</option>
            {['planning', 'in_progress', 'completed', 'on_hold'].map((s) => <option key={s} value={s}>{SEM_STATUS[s].th}</option>)}
          </select>
          <span className="text-sm text-mes-muted sm:ml-1">แสดง {filteredSections.length} จาก {sections.length}</span>
        </div>
        <SectionList
          sections={filteredSections}
          onView={(s) => { setEditingSection(s); setModalEditing(false); setIsEditModalOpen(true); }}
          onEdit={(s) => { setEditingSection(s); setModalEditing(true); setIsEditModalOpen(true); }}
          onDelete={(id) => setDeleteId(id)}
        />
      </div>
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="สร้างชั้นในโครงการ">
        <div className="p-1">
          <FVSection onAddSection={handleCreateSection} />
        </div>
      </Modal>
      <EditSectionModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        section={editingSection}
        onSave={handleEditSection}
        isEditing={modalEditing}
      />
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteSection}
        title="ลบชั้น"
        message="คุณแน่ใจว่าต้องการลบชั้นนี้หรือไม่?"
        confirmLabel="ลบ"
        danger
      />
      {toastNode}
    </PageContainer>
  );
};

export default FormSection;
