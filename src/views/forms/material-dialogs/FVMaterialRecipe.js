// [MES] FVMaterialRecipe — create a draft recipe (Formik + Yup) inside a Modal.
// Recipes are always created as 'draft'; activation is a separate governed action.
import PropTypes from 'prop-types';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Modal } from 'src/components/mes/ui';

const SOURCE_ATTR_OPTIONS = [
  { value: 'volume', label: 'ปริมาตร (m³)' },
  { value: 'area', label: 'พื้นที่ (m²)' },
  { value: 'weight', label: 'น้ำหนัก (kg)' },
  { value: 'per_piece', label: 'ต่อชิ้น' },
];

const blankValues = {
  component_type: '',
  material_id: '',
  source_attr: '',
  factor: '',
  waste_pct: 0,
};

const schema = Yup.object({
  component_type: Yup.string().required('กรุณากรอกประเภทชิ้นงาน'),
  material_id: Yup.string().required('กรุณาเลือกวัสดุ'),
  source_attr: Yup.string()
    .oneOf(SOURCE_ATTR_OPTIONS.map((o) => o.value))
    .required('กรุณาเลือกแหล่งค่า'),
  factor: Yup.number().typeError('ตัวเลข').moreThan(0, 'ต้องมากกว่า 0').required('กรุณากรอกตัวคูณ'),
  waste_pct: Yup.number().typeError('ตัวเลข').min(0, 'ต้องไม่ติดลบ').required('กรุณากรอกเผื่อเสีย'),
});

const FieldError = ({ msg }) => (msg ? <div className="mt-1 text-xs text-sem-danger">{msg}</div> : null);
FieldError.propTypes = { msg: PropTypes.node };
FieldError.defaultProps = { msg: null };

const FVMaterialRecipe = ({ open, onClose, materials, onSave }) => (
  <Formik initialValues={blankValues} validationSchema={schema} enableReinitialize onSubmit={() => {}}>
    {({ values, errors, touched, handleChange, handleBlur, validateForm, setTouched }) => {
      const submit = async () => {
        const errs = await validateForm();
        if (Object.keys(errs).length > 0) {
          setTouched({ component_type: true, material_id: true, source_attr: true, factor: true, waste_pct: true });
          return;
        }
        const payload = {
          component_type: values.component_type.trim(),
          material_id: values.material_id,
          source_attr: values.source_attr,
          factor: Number(values.factor),
          waste_pct: values.waste_pct === '' ? 0 : Number(values.waste_pct),
        };
        await onSave(payload);
      };

      return (
        <Modal
          open={open}
          onClose={onClose}
          title="สร้างสูตร (ร่าง)"
          footer={
            <>
              <button className="mes-btn mes-btn-ghost" onClick={onClose}>ยกเลิก</button>
              <button className="mes-btn mes-btn-primary" onClick={submit}>บันทึกร่าง</button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="mes-label" htmlFor="rc-type">ประเภทชิ้นงาน *</label>
              <input
                id="rc-type"
                className="mes-input"
                name="component_type"
                value={values.component_type}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <div className="mt-1 text-xs text-mes-muted">
                ต้องตรงกับประเภทชิ้นงานในระบบ ระบบจับคู่แบบไม่สนตัวพิมพ์เล็ก-ใหญ่
              </div>
              <FieldError msg={touched.component_type && errors.component_type} />
            </div>
            <div>
              <label className="mes-label" htmlFor="rc-material">วัสดุ *</label>
              <select
                id="rc-material"
                className="mes-input"
                name="material_id"
                value={values.material_id}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">—</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.code} — {m.name_th}</option>
                ))}
              </select>
              <FieldError msg={touched.material_id && errors.material_id} />
            </div>
            <div>
              <label className="mes-label" htmlFor="rc-attr">แหล่งค่า *</label>
              <select
                id="rc-attr"
                className="mes-input"
                name="source_attr"
                value={values.source_attr}
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="">—</option>
                {SOURCE_ATTR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <FieldError msg={touched.source_attr && errors.source_attr} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mes-label" htmlFor="rc-factor">ตัวคูณ *</label>
                <input
                  id="rc-factor"
                  className="mes-input"
                  type="number"
                  inputMode="decimal"
                  name="factor"
                  value={values.factor}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FieldError msg={touched.factor && errors.factor} />
              </div>
              <div>
                <label className="mes-label" htmlFor="rc-waste">เผื่อเสีย (%)</label>
                <input
                  id="rc-waste"
                  className="mes-input"
                  type="number"
                  inputMode="decimal"
                  name="waste_pct"
                  value={values.waste_pct}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FieldError msg={touched.waste_pct && errors.waste_pct} />
              </div>
            </div>
          </div>
        </Modal>
      );
    }}
  </Formik>
);

FVMaterialRecipe.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  materials: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSave: PropTypes.func.isRequired,
};

export default FVMaterialRecipe;
