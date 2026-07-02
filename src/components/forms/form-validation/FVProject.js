// [MES] FVProject — project create form (Formik + Yup).
// Validation schema identical to previous implementation.
import { useFormik } from 'formik';
import * as yup from 'yup';

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
    .oneOf(['Planning', 'In Progress', 'Completed', 'On Hold'])
    .required('กรุณาใส่จำนวนชั้นของโครงการ'),
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
    onSubmit: (values) => {
      const newProject = {
        name: values.projectName,
        project_code: values.projectCode,
        sections: values.section,
        status: values.status,
      };
      onAddProject(newProject);
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
        <FieldError show={formik.touched.section} msg={formik.errors.section} />
      </div>
      <div>
        <label className="mes-label" htmlFor="status">สถานะโครงการ</label>
        <select
          id="status"
          name="status"
          className="mes-input"
          value={formik.values.status}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        >
          <option value="">เลือกสถานะโครงการ</option>
          <option value="Planning">Planning</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
        <FieldError show={formik.touched.status} msg={formik.errors.status} />
      </div>
      <div>
        <button className="mes-btn mes-btn-primary w-full sm:w-auto" type="submit">
          บันทึกโครงการเข้าระบบ
        </button>
      </div>
    </form>
  );
};

export default FVProject;
