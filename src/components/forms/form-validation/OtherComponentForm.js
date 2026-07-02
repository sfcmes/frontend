// [MES] OtherComponentForm — create a quantity-tracked "other" component.
import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { createOtherComponent } from 'src/utils/api';

const validationSchema = yup.object({
  project_id: yup.string().required('กรุณาเลือกโครงการ'),
  name: yup.string().required('กรุณาใส่ชื่อชิ้นงาน'),
  width: yup.number().positive('ความกว้างต้องเป็นตัวเลขบวก').required('กรุณาใส่ความกว้างของชิ้นงาน'),
  height: yup.number().positive('ความสูงต้องเป็นตัวเลขบวก').required('กรุณาใส่ความสูงของชิ้นงาน'),
  thickness: yup.number().positive('ความหนาต้องเป็นตัวเลขบวก').required('กรุณาใส่ความหนาของชิ้นงาน'),
  total_quantity: yup.number().positive('จำนวนต้องเป็นตัวเลขบวก').required('กรุณาใส่จำนวนของชิ้นงาน'),
});

const FieldError = ({ show, msg }) => (show && msg ? <div className="mt-1 text-xs text-sem-danger">{msg}</div> : null);

const OtherComponentForm = ({ projects, onProjectChange, onComponentAdded }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer;
    if (success || error) {
      timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [success, error]);

  const formik = useFormik({
    initialValues: {
      project_id: '',
      name: '',
      width: '',
      height: '',
      thickness: '',
      total_quantity: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      setSuccess('');
      setIsSubmitting(true);
      try {
        const response = await createOtherComponent(values);
        setSuccess('ชิ้นงานอื่นๆ ถูกสร้างเรียบร้อยแล้ว');
        onComponentAdded(response);
        formik.resetForm();
      } catch {
        setError('เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองอีกครั้ง');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const numField = (name, label) => (
    <div>
      <label className="mes-label" htmlFor={`ocf-${name}`}>{label}</label>
      <input
        id={`ocf-${name}`}
        name={name}
        className="mes-input"
        type="number"
        inputMode="decimal"
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      <FieldError show={formik.touched[name]} msg={formik.errors[name]} />
    </div>
  );

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-3">
      {error && <div className="rounded-sm border border-sem-danger px-3 py-2 text-sm text-sem-danger">{error}</div>}
      {success && <div className="rounded-sm border border-sem-success px-3 py-2 text-sm text-sem-success">{success}</div>}

      <div>
        <label className="mes-label" htmlFor="ocf-project">โครงการ</label>
        <select
          id="ocf-project"
          name="project_id"
          className="mes-input"
          value={formik.values.project_id}
          onChange={(event) => {
            formik.setFieldValue('project_id', event.target.value);
            onProjectChange(event);
          }}
        >
          <option value="">—</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <FieldError show={formik.touched.project_id} msg={formik.errors.project_id} />
      </div>

      <div>
        <label className="mes-label" htmlFor="ocf-name">ชื่อชิ้นงาน</label>
        <input
          id="ocf-name"
          name="name"
          className="mes-input"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <FieldError show={formik.touched.name} msg={formik.errors.name} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {numField('width', 'ความกว้าง (มม.)')}
        {numField('height', 'ความสูง (มม.)')}
        {numField('thickness', 'ความหนา (มม.)')}
        {numField('total_quantity', 'จำนวน')}
      </div>

      <div>
        <button className="mes-btn mes-btn-primary w-full sm:w-auto" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
      </div>
    </form>
  );
};

export default OtherComponentForm;
