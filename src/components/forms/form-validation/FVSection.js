// [MES] FVSection — section create form (Formik + Yup).
// Validation schema identical to previous implementation.
import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { fetchProjects } from 'src/utils/api';
import SemStatusSelect from 'src/components/mes/SemStatusSelect';

const validationSchema = yup.object({
  projectSelection: yup
    .string()
    .required('กรุณาเลือกโครงการ'),
  sectionName: yup
    .string()
    .min(2, 'Too Short!')
    .max(100, 'Too Long!')
    .required('กรุณาใส่ชื่อชั้น'),
  components: yup
    .number()
    .integer('Components must be an integer')
    .min(1, 'Components must be at least 1')
    .max(9999, 'Components must be less than or equal to 9999')
    .required('กรุณาใส่จำนวนชิ้นงาน'),
  status: yup
    .string()
    .oneOf(['planning', 'in_progress', 'completed', 'on_hold'])
    .required('กรุณาเลือกสถานะของชั้น'),
});

const FieldError = ({ show, msg }) => (show && msg ? <div className="mt-1 text-xs text-sem-danger">{msg}</div> : null);

const FVSection = ({ onAddSection }) => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects()
      .then((response) => setProjects(response.data))
      .catch(() => setProjects([]));
  }, []);

  const formik = useFormik({
    initialValues: {
      projectSelection: '',
      sectionName: '',
      components: '',
      status: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      const selectedProject = projects.find((p) => `${p.project_code}-${p.id}` === values.projectSelection);
      const newSection = {
        project_id: selectedProject.id,
        name: values.sectionName,
        components: values.components,
        status: values.status,
      };
      await onAddSection(newSection);
      formik.resetForm();
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mes-label" htmlFor="projectSelection">รหัสโครงการ</label>
        <select
          id="projectSelection"
          name="projectSelection"
          className="mes-input"
          value={formik.values.projectSelection}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        >
          <option value="">เลือกรหัสโครงการ</option>
          {projects.map((project) => (
            <option key={project.id} value={`${project.project_code}-${project.id}`}>
              {project.project_code} - {project.name}
            </option>
          ))}
        </select>
        <FieldError show={formik.touched.projectSelection} msg={formik.errors.projectSelection} />
      </div>
      <div>
        <label className="mes-label" htmlFor="sectionName">ชื่อชั้นในโครงการ</label>
        <input
          id="sectionName"
          name="sectionName"
          className="mes-input"
          value={formik.values.sectionName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <FieldError show={formik.touched.sectionName} msg={formik.errors.sectionName} />
      </div>
      <div>
        <label className="mes-label" htmlFor="components">จำนวนชิ้นงาน</label>
        <div className="mes-affix">
          <input
            id="components"
            name="components"
            className="mes-input"
            type="number"
            inputMode="numeric"
            placeholder="10"
            value={formik.values.components}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <span className="mes-affix-unit">ชิ้น</span>
        </div>
        <FieldError show={formik.touched.components} msg={formik.errors.components} />
        <div className="mes-hint">จำนวนชิ้นงานที่วางแผนไว้สำหรับชั้นนี้</div>
      </div>
      <div>
        <label className="mes-label" htmlFor="status">สถานะของชั้นในโครงการ</label>
        <SemStatusSelect
          id="status"
          name="status"
          value={formik.values.status}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          order={['planning', 'in_progress', 'completed', 'on_hold']}
          placeholder="เลือกสถานะของชั้น"
        />
        <FieldError show={formik.touched.status} msg={formik.errors.status} />
      </div>
      <div>
        <button className="mes-btn mes-btn-primary w-full sm:w-auto" type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? 'กำลังบันทึก…' : 'บันทึกชั้นเข้าระบบ'}
        </button>
      </div>
    </form>
  );
};

export default FVSection;
