// [MES] PrecastComponentForm — create a precast component with PDF drawing.
// Status choices use the canonical workflow; the non-canonical `in_transit`
// value was removed per CONTEXT.md decision 2026-07-02 (approved exception).
import { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { createPrecastComponent } from 'src/utils/api';
import { COMPONENT_STATUS, PIPE_ORDER } from 'src/components/mes/status-meta';

const validationSchema = yup.object({
  projectName: yup.string().required('กรุณาเลือกโครงการ'),
  sectionId: yup.string().required('กรุณาเลือกส่วน'),
  componentName: yup.string().required('กรุณาใส่ชื่อชิ้นงาน'),
  width: yup
    .number()
    .positive('ความกว้างต้องเป็นตัวเลขบวก')
    .required('กรุณาใส่ความกว้างของชิ้นงาน'),
  height: yup.number().positive('ความสูงต้องเป็นตัวเลขบวก').required('กรุณาใส่ความสูงของชิ้นงาน'),
  thickness: yup
    .number()
    .positive('ความหนาต้องเป็นตัวเลขบวก')
    .required('กรุณาใส่ความหนาของชิ้นงาน'),
  extension: yup
    .number()
    .min(0, 'ส่วนขยายต้องเป็นตัวเลขที่ไม่ติดลบ')
    .required('กรุณาใส่ส่วนขยายของชิ้นงาน'),
  reduction: yup
    .number()
    .min(0, 'ส่วนลดต้องเป็นตัวเลขที่ไม่ติดลบ')
    .required('กรุณาใส่ส่วนลดของชิ้นงาน'),
  area: yup.number().positive('พื้นที่ต้องเป็นตัวเลขบวก').required('กรุณาใส่พื้นที่ของชิ้นงาน'),
  volume: yup.number().positive('ปริมาตรต้องเป็นตัวเลขบวก').required('กรุณาใส่ปริมาตรของชิ้นงาน'),
  weight: yup.number().positive('น้ำหนักต้องเป็นตัวเลขบวก').required('กรุณาใส่น้ำหนักของชิ้นงาน'),
  status: yup
    .string()
    .oneOf(PIPE_ORDER)
    .required('กรุณาเลือกสถานะของชิ้นงาน'),
  file: yup.mixed().required('กรุณาอัพโหลดไฟล์ PDF'),
});

const FieldError = ({ show, msg }) => (show && msg ? <div className="mt-1 text-xs text-sem-danger">{msg}</div> : null);

const NumberField = ({ formik, name, label }) => (
  <div>
    <label className="mes-label" htmlFor={name}>{label}</label>
    <input
      id={name}
      className="mes-input"
      type="number"
      inputMode="decimal"
      {...formik.getFieldProps(name)}
    />
    <FieldError show={formik.touched[name]} msg={formik.errors[name]} />
  </div>
);

const PrecastComponentForm = ({ projects, sections, onProjectChange }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formik = useFormik({
    initialValues: {
      projectName: '',
      sectionId: '',
      componentName: '',
      width: '',
      height: '',
      thickness: '',
      extension: '',
      reduction: '',
      area: '',
      volume: '',
      weight: '',
      status: '',
      file: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      setSuccess('');
      try {
        const formData = new FormData();
        formData.append('section_id', values.sectionId);
        formData.append('name', values.componentName);
        formData.append('width', values.width);
        formData.append('height', values.height);
        formData.append('thickness', values.thickness);
        formData.append('extension', values.extension);
        formData.append('reduction', values.reduction);
        formData.append('area', values.area);
        formData.append('volume', values.volume);
        formData.append('weight', values.weight);
        formData.append('status', values.status);
        if (values.file) {
          formData.append('file', values.file);
        }
        await createPrecastComponent(formData);
        setSuccess('ชิ้นงานถูกสร้างเรียบร้อยแล้ว');
        formik.resetForm();
      } catch (err) {
        if (err.message === 'A component with this name already exists in this section') {
          setError('ชิ้นงานที่มีชื่อนี้มีอยู่แล้วในส่วนนี้ กรุณาใช้ชื่ออื่น');
        } else {
          setError(`เกิดข้อผิดพลาดในการสร้างชิ้นงาน: ${err.message}`);
        }
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="rounded-sm border border-sem-danger px-3 py-2 text-sm text-sem-danger">{error}</div>
      )}
      {success && (
        <div className="rounded-sm border border-sem-success px-3 py-2 text-sm text-sem-success">{success}</div>
      )}

      <div>
        <label className="mes-label" htmlFor="projectName">โครงการ</label>
        <select
          id="projectName"
          name="projectName"
          className="mes-input"
          value={formik.values.projectName}
          onChange={(event) => {
            formik.setFieldValue('projectName', event.target.value);
            onProjectChange(event);
          }}
        >
          <option value="">—</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <FieldError show={formik.touched.projectName} msg={formik.errors.projectName} />
      </div>

      <div>
        <label className="mes-label" htmlFor="sectionId">ชั้น</label>
        <select
          id="sectionId"
          name="sectionId"
          className="mes-input"
          value={formik.values.sectionId}
          onChange={formik.handleChange}
        >
          <option value="">—</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>{section.name}</option>
          ))}
        </select>
        <FieldError show={formik.touched.sectionId} msg={formik.errors.sectionId} />
      </div>

      <div>
        <label className="mes-label" htmlFor="componentName">ชื่อชิ้นงาน</label>
        <input id="componentName" className="mes-input" {...formik.getFieldProps('componentName')} />
        <FieldError show={formik.touched.componentName} msg={formik.errors.componentName} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <NumberField formik={formik} name="width" label="ความกว้าง (มม.)" />
        <NumberField formik={formik} name="height" label="ความสูง (มม.)" />
        <NumberField formik={formik} name="thickness" label="ความหนา (มม.)" />
        <NumberField formik={formik} name="extension" label="ส่วนขยาย (ตร.ม.)" />
        <NumberField formik={formik} name="reduction" label="ส่วนลด (ตร.ม.)" />
        <NumberField formik={formik} name="area" label="พื้นที่ (ตร.ม.)" />
        <NumberField formik={formik} name="volume" label="ปริมาตร (ลบ.ม.)" />
        <NumberField formik={formik} name="weight" label="น้ำหนัก (ตัน)" />
      </div>

      <div>
        <label className="mes-label" htmlFor="status">สถานะ</label>
        <select id="status" className="mes-input" {...formik.getFieldProps('status')}>
          <option value="">—</option>
          {PIPE_ORDER.map((k) => (
            <option key={k} value={k}>{COMPONENT_STATUS[k].th}</option>
          ))}
        </select>
        <FieldError show={formik.touched.status} msg={formik.errors.status} />
      </div>

      <div>
        <label className="mes-label" htmlFor="file">ไฟล์แบบ (PDF)</label>
        <input
          id="file"
          name="file"
          className="mes-input !py-2.5"
          type="file"
          onChange={(event) => formik.setFieldValue('file', event.currentTarget.files[0])}
        />
        <FieldError show={formik.touched.file} msg={formik.errors.file} />
      </div>

      <div>
        <button className="mes-btn mes-btn-primary w-full sm:w-auto" type="submit">บันทึก</button>
      </div>
    </form>
  );
};

export default PrecastComponentForm;
