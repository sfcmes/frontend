// [MES] EditSectionModal — edit a section (name, status; project fixed).
// Previous version was English-only; rebuilt Thai-first, save payload unchanged.
import { useState, useEffect } from 'react';
import { Modal } from 'src/components/mes/ui';
import { SEM_STATUS } from 'src/components/mes/status-meta';
import SemStatusSelect from 'src/components/mes/SemStatusSelect';

const EditSectionModal = ({ open, section, onClose, onSave, isEditing }) => {
  const [formData, setFormData] = useState({
    projectSelection: '',
    sectionName: '',
    components: '',
    status: '',
  });

  useEffect(() => {
    if (section) {
      setFormData({
        projectSelection: section.project_id || '',
        sectionName: section.name || '',
        components: section.components ?? '',
        status: section.status || '',
      });
    }
  }, [section]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const updatedSection = {
      id: section.id,
      project_id: formData.projectSelection,
      name: formData.sectionName,
      components: formData.components,
      status: formData.status,
      updated_at: new Date(),
    };
    await onSave(updatedSection);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'แก้ไขชั้น' : 'รายละเอียดชั้น'}
      footer={
        <>
          <button className="mes-btn mes-btn-ghost" onClick={onClose}>ยกเลิก</button>
          {isEditing && (
            <button className="mes-btn mes-btn-primary" onClick={handleSave}>บันทึก</button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="mes-label" htmlFor="esm-project">โครงการ</label>
          <select
            id="esm-project"
            name="projectSelection"
            className="mes-input"
            value={formData.projectSelection}
            onChange={handleChange}
            disabled={!isEditing}
          >
            <option value={section?.project_id || ''}>
              {section?.project_name || 'เลือกโครงการ'}
            </option>
          </select>
        </div>
        <div>
          <label className="mes-label" htmlFor="esm-name">ชื่อชั้น</label>
          <input
            id="esm-name"
            name="sectionName"
            className="mes-input"
            value={formData.sectionName}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <label className="mes-label" htmlFor="esm-components">จำนวนชิ้นงาน</label>
          <div className="mes-affix">
            <input
              id="esm-components"
              name="components"
              className="mes-input"
              type="number"
              inputMode="numeric"
              value={formData.components}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <span className="mes-affix-unit">ชิ้น</span>
          </div>
        </div>
        <div>
          <label className="mes-label" htmlFor="esm-status">สถานะ</label>
          {isEditing ? (
            <SemStatusSelect
              id="esm-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              order={['planning', 'in_progress', 'completed', 'on_hold']}
              placeholder="เลือกสถานะของชั้น"
            />
          ) : (
            <select
              id="esm-status"
              name="status"
              className="mes-input"
              value={formData.status}
              onChange={handleChange}
              disabled
            >
              {['planning', 'in_progress', 'completed', 'on_hold'].map((s) => (
                <option key={s} value={s}>{SEM_STATUS[s].th}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditSectionModal;
