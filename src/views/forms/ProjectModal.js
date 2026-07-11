// [MES] ProjectModal — view/edit a project (name, code; status read-only).
// Previous version was English-only; rebuilt Thai-first.
import { useState, useEffect } from 'react';
import { Modal } from 'src/components/mes/ui';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import SemStatusSelect from 'src/components/mes/SemStatusSelect';

const ProjectModal = ({ open, project, onClose, onSave, isEditing }) => {
  const [formData, setFormData] = useState({
    name: '',
    project_code: '',
    status: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        project_code: project.project_code,
        status: project.status,
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    await onSave({ ...project, ...formData });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'แก้ไขโครงการ' : 'ดูโครงการ'}
      footer={
        <>
          <button className="mes-btn mes-btn-ghost" onClick={onClose}>ปิด</button>
          {isEditing && (
            <button className="mes-btn mes-btn-primary" onClick={handleSave}>บันทึก</button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="mes-label" htmlFor="pm-name">ชื่อโครงการ</label>
          <input
            id="pm-name"
            name="name"
            className="mes-input"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <label className="mes-label" htmlFor="pm-code">รหัสโครงการ</label>
          <input
            id="pm-code"
            name="project_code"
            className="mes-input font-mono"
            value={formData.project_code}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div>
          <div className="mes-label">สถานะ</div>
          {isEditing ? (
            <SemStatusSelect
              id="pm-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              order={['planning', 'in_progress', 'completed', 'on_hold']}
              placeholder="เลือกสถานะโครงการ"
            />
          ) : (
            <StatusBadge status={formData.status} kind="sem" />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProjectModal;
