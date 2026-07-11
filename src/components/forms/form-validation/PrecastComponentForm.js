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

// Auto-calc พื้นที่/ปริมาตร — same formula as ComponentDetails.js (component-details-feature skill).
// area   = (width × height) / 1,000,000 + extension − reduction   [ตร.ม.]
// volume = area × (thickness / 1000)                              [ลบ.ม.]
const num = (v) => parseFloat(v) || 0;
const computeAreaVolume = (v) => {
  const area = (num(v.width) * num(v.height)) / 1_000_000 + num(v.extension) - num(v.reduction);
  const volume = area * (num(v.thickness) / 1000);
  return {
    area: area ? parseFloat(area.toFixed(6)) : '',
    volume: volume ? parseFloat(volume.toFixed(6)) : '',
  };
};

const NumberField = ({ formik, name, label, hint, unit, auto, onChange }) => (
  <div>
    <div className="mb-1.5 flex items-center gap-2">
      <label className="mes-label !mb-0" htmlFor={name}>{label}</label>
      {auto && (
        <span className="rounded-sm border border-mes-border px-1.5 text-xs text-mes-muted">อัตโนมัติ</span>
      )}
    </div>
    <div className={unit ? 'mes-affix' : ''}>
      <input
        id={name}
        className={`mes-input${auto ? ' mes-input-auto' : ''}`}
        type="number"
        inputMode="decimal"
        {...formik.getFieldProps(name)}
        {...(onChange ? { onChange } : {})}
      />
      {unit && <span className="mes-affix-unit">{unit}</span>}
    </div>
    {hint && <div className="mt-1 text-xs text-mes-muted">{hint}</div>}
    <FieldError show={formik.touched[name]} msg={formik.errors[name]} />
  </div>
);

const PrecastComponentForm = ({ projects, sections, onProjectChange }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setSubmitting(true);
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
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Recompute พื้นที่/ปริมาตร on any dimension change — user can still type over
  // area/volume afterwards (override stays until a dimension changes again).
  const handleDimChange = (e) => {
    formik.handleChange(e);
    const next = { ...formik.values, [e.target.name]: e.target.value };
    const { area, volume } = computeAreaVolume(next);
    formik.setFieldValue('area', area);
    formik.setFieldValue('volume', volume);
  };

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="rounded-sm border border-sem-danger px-3 py-2 text-sm text-sem-danger">{error}</div>
      )}
      {success && (
        <div className="rounded-sm border border-sem-success px-3 py-2 text-sm text-sem-success">{success}</div>
      )}

      <div className="flex flex-col gap-3">
        <span className="mes-group-label">โครงการ / ชั้น</span>
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
      </div>

      <div>
        <span className="mes-group-label">ขนาด</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberField formik={formik} name="width" label="ความกว้าง" unit="มม." onChange={handleDimChange} />
          <NumberField formik={formik} name="height" label="ความสูง" unit="มม." onChange={handleDimChange} />
          <NumberField formik={formik} name="thickness" label="ความหนา" unit="มม." onChange={handleDimChange} />
          <NumberField formik={formik} name="extension" label="ส่วนขยาย" unit="ตร.ม." onChange={handleDimChange} />
          <NumberField formik={formik} name="reduction" label="ส่วนลด" unit="ตร.ม." onChange={handleDimChange} />
        </div>
      </div>

      <div>
        <span className="mes-group-label">ค่าที่คำนวณ</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberField formik={formik} name="area" label="พื้นที่" unit="ตร.ม." auto hint="คำนวณอัตโนมัติ · แก้ทับได้" />
          <NumberField formik={formik} name="volume" label="ปริมาตร" unit="ม³" auto hint="คำนวณอัตโนมัติ · แก้ทับได้" />
          <NumberField formik={formik} name="weight" label="น้ำหนัก" unit="ตัน" />
        </div>
      </div>

      <div>
        <span className="mes-group-label">สถานะ</span>
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
      </div>

      <div>
        <span className="mes-group-label">ไฟล์แบบ</span>
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
      </div>

      <div>
        <button className="mes-btn mes-btn-primary w-full sm:w-auto" type="submit" disabled={submitting}>
          {submitting ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
      </div>
    </form>
  );
};

export default PrecastComponentForm;
