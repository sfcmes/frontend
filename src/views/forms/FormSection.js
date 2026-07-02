// [MES] FormSection — section (ชั้น) list + create form + edit modal.
// Data logic identical to previous implementation.
import { useState, useEffect } from 'react';
import PageContainer from '../../components/container/PageContainer';
import EditSectionModal from './EditSectionModal';
import FVSection from '../../components/forms/form-validation/FVSection';
import api, { createSection, updateSection, deleteSection } from '../../utils/api';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { ConfirmDialog, EmptyState, useToast, CardHeader } from 'src/components/mes/ui';

const SectionList = ({ sections, onEdit, onDelete }) => (
  sections.length === 0 ? (
    <EmptyState icon="brand-codepen" title="ยังไม่มีข้อมูลชั้น" />
  ) : (
    <>
      {/* base: cards */}
      <div className="flex flex-col gap-2 p-3 md:hidden">
        {sections.map((section) => (
          <div key={section.id} className="mes-card p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 grow">
                <div className="truncate text-sm font-semibold">{section.name}</div>
                <div className="truncate text-xs text-mes-muted">{section.project_name}</div>
              </div>
              <StatusBadge status={section.status} kind="sem" />
            </div>
            <div className="mt-1.5 text-xs text-mes-muted tabular-nums">{section.components || 'N/A'} ชิ้นงาน</div>
            <div className="mt-2 flex gap-1.5">
              <button className="mes-btn mes-btn-ghost !min-h-touch text-xs" onClick={() => onEdit(section)}>แก้ไข</button>
              <button className="mes-btn mes-btn-danger !min-h-touch text-xs" onClick={() => onDelete(section.id)}>ลบ</button>
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
              <tr key={section.id} className="hover:bg-mes-surface-2">
                <td className="mes-td"><span className="block max-w-[200px] truncate">{section.project_name}</span></td>
                <td className="mes-td font-semibold">{section.name}</td>
                <td className="mes-td"><StatusBadge status={section.status} kind="sem" /></td>
                <td className="mes-td text-right">{section.components || 'N/A'}</td>
                <td className="mes-td">
                  <div className="flex justify-end gap-1.5">
                    <button className="mes-btn mes-btn-ghost !min-h-0 !py-1.5 text-xs" onClick={() => onEdit(section)}>แก้ไข</button>
                    <button className="mes-btn mes-btn-danger !min-h-0 !py-1.5 text-xs" onClick={() => onDelete(section.id)}>ลบ</button>
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
  const [deleteId, setDeleteId] = useState(null);
  const { showToast, toastNode } = useToast();

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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="mes-card self-start">
          <CardHeader title="ภาพรวมแต่ละชั้นของแต่ละโครงการ" />
          <SectionList
            sections={sections}
            onEdit={(s) => { setEditingSection(s); setIsEditModalOpen(true); }}
            onDelete={(id) => setDeleteId(id)}
          />
        </div>
        <div className="mes-card self-start">
          <CardHeader title="สร้างชั้นของแต่ละโครงการ" />
          <div className="p-4 md:p-5">
            <FVSection onAddSection={handleAddSection} />
          </div>
        </div>
      </div>
      <EditSectionModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        section={editingSection}
        onSave={handleEditSection}
        isEditing
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
