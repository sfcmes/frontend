// [MES] FVProject — project create form (Formik + Yup).
// Validation schema identical to previous implementation.
import { useFormik } from 'formik';
import * as yup from 'yup';
import SemStatusSelect from 'src/components/mes/SemStatusSelect';

const validationSchema = yup.object({
  projectName: yup
    .string()
    .min(2, 'Too Short!')
    .max(50, 'Too Long!')
    .required('กรุณาเลือกชื่อโครงการ'),
  projectCode: yup
    .string()
    .min(2, 'Too Short!')
    .max(50, 'Too Long!')
    .required('กรุณาใส่รหัสของโครงการ'),
  section: yup
    .number()
    .integer('Section must be an integer')
    .min(1, 'Section must be at least 1')
    .max(100, 'Section must be less than or equal to 100')
    .required('กรุณาใส่จำนวนชั้นทั้งหมด'),
  status: yup
    .string()
    .oneOf(['planning', 'in_progress', 'completed', 'on_hold'])
    .required('กรุณาเลือกสถานะโครงการ'),
});

const FieldError = ({ show, msg }) => (show && msg ? <div className="mt-1 text-xs text-sem-danger">{msg}</div> : null);

const FVProject = ({ onAddProject }) => {
  const formik = useFormik({
    initialValues: {
      projectName: '',
      projectCode: '',
      section: '',
      status: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      const newProject = {
        name: values.projectName,
        project_code: values.projectCode,
        sections: values.section,
        status: values.status,
      };
      await onAddProject(newProject);
      formik.resetForm();
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mes-label" htmlFor="projectName">ชื่อโครงการ</label>
        <input
          id="projectName"
          name="projectName"
          className="mes-input"
          placeholder="กรอกชื่อโครงการ"
          value={formik.values.projectName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <FieldError show={formik.touched.projectName} msg={formik.errors.projectName} />
      </div>
      <div>
        <label className="mes-label" htmlFor="projectCode">รหัสโครงการ</label>
        <input
          id="projectCode"
          name="projectCode"
          className="mes-input"
          placeholder="กรอกรหัสของโครงการ"
          value={formik.values.projectCode}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <FieldError show={formik.touched.projectCode} msg={formik.errors.projectCode} />
      </div>
      <div>
        <label className="mes-label" htmlFor="section">จำนวนชั้นของโครงการ</label>
        <div className="mes-affix">
          <input
            id="section"
            name="section"
            className="mes-input"
            type="number"
            inputMode="numeric"
            placeholder="กรอกจำนวนชั้นทั้งหมดของโครงการ"
            value={formik.values.section}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          <span className="mes-affix-unit">ชั้น</span>
        </div>
        <FieldError show={formik.touched.section} msg={formik.errors.section} />
        <div className="mes-hint">จำนวนชั้นทั้งหมดของอาคาร (1–100)</div>
      </div>
      <div>
        <label className="mes-label" htmlFor="status">สถานะโครงการ</label>
        <SemStatusSelect
          id="status"
          name="status"
          value={formik.values.status}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          order={['planning', 'in_progress', 'completed', 'on_hold']}
          placeholder="เลือกสถานะโครงการ"
        />
        <FieldError show={formik.touched.status} msg={formik.errors.status} />
      </div>
      <div>
        <button className="mes-btn mes-btn-primary w-full sm:w-auto" type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? 'กำลังบันทึก…' : 'บันทึกโครงการเข้าระบบ'}
        </button>
      </div>
    </form>
  );
};

export default FVProject;
