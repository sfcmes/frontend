// [MES] FVMaterial — material create/edit form (Formik + Yup) inside a Modal.
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Modal } from 'src/components/mes/ui';

const blankValues = {
  code: '',
  name_th: '',
  unit: '',
  pack_size: '',
  min_order_qty: '',
  default_supplier: '',
};

const schema = Yup.object({
  code: Yup.string().required('กรุณากรอกรหัสวัสดุ'),
  name_th: Yup.string().required('กรุณากรอกชื่อวัสดุ'),
  unit: Yup.string().required('กรุณากรอกหน่วย'),
  pack_size: Yup.number()
    .typeError('ตัวเลข')
    .positive('ต้องมากกว่า 0')
    .nullable()
    .transform((v, o) => (o === '' ? null : v)),
  min_order_qty: Yup.number()
    .typeError('ตัวเลข')
    .positive('ต้องมากกว่า 0')
    .nullable()
    .transform((v, o) => (o === '' ? null : v)),
  default_supplier: Yup.string().nullable(),
});

const FieldError = ({ msg }) => (msg ? <div className="mt-1 text-xs text-sem-danger">{msg}</div> : null);
FieldError.propTypes = { msg: PropTypes.node };
FieldError.defaultProps = { msg: null };

// FVMaterial — used both for create (initialValues=null) and edit (initialValues=material row).
const FVMaterial = ({ open, onClose, initialValues, onSave }) => {
  const start = useMemo(() => {
    if (!initialValues) return blankValues;
    return {
      code: initialValues.code || '',
      name_th: initialValues.name_th || '',
      unit: initialValues.unit || '',
      pack_size: initialValues.pack_size ?? '',
      min_order_qty: initialValues.min_order_qty ?? '',
      default_supplier: initialValues.default_supplier || '',
    };
  }, [initialValues]);

  return (
    <Formik initialValues={start} validationSchema={schema} enableReinitialize onSubmit={() => {}}>
      {({ values, errors, touched, handleChange, handleBlur, validateForm, setTouched }) => {
        const submit = async () => {
          const errs = await validateForm();
          if (Object.keys(errs).length > 0) {
            setTouched({ code: true, name_th: true, unit: true });
            return;
          }
          const payload = {
            code: values.code,
            name_th: values.name_th,
            unit: values.unit,
            pack_size: values.pack_size === '' ? null : Number(values.pack_size),
            min_order_qty: values.min_order_qty === '' ? null : Number(values.min_order_qty),
            default_supplier: values.default_supplier || null,
          };
          await onSave(payload);
        };

        return (
          <Modal
            open={open}
            onClose={onClose}
            title={initialValues ? 'แก้ไขวัสดุ' : 'เพิ่มวัสดุ'}
            footer={
              <>
                <button className="mes-btn mes-btn-ghost" onClick={onClose}>ยกเลิก</button>
                <button className="mes-btn mes-btn-primary" onClick={submit}>บันทึก</button>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mes-label" htmlFor="mat-code">รหัส *</label>
                <input
                  id="mat-code"
                  className="mes-input"
                  name="code"
                  value={values.code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FieldError msg={touched.code && errors.code} />
              </div>
              <div>
                <label className="mes-label" htmlFor="mat-unit">หน่วย *</label>
                <input
                  id="mat-unit"
                  className="mes-input"
                  name="unit"
                  value={values.unit}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FieldError msg={touched.unit && errors.unit} />
              </div>
              <div className="sm:col-span-2">
                <label className="mes-label" htmlFor="mat-name">ชื่อวัสดุ *</label>
                <input
                  id="mat-name"
                  className="mes-input"
                  name="name_th"
                  value={values.name_th}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FieldError msg={touched.name_th && errors.name_th} />
              </div>
              <div>
                <label className="mes-label" htmlFor="mat-pack">ขนาดแพ็ค</label>
                <input
                  id="mat-pack"
                  className="mes-input"
                  type="number"
                  inputMode="decimal"
                  name="pack_size"
                  value={values.pack_size}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FieldError msg={touched.pack_size && errors.pack_size} />
              </div>
              <div>
                <label className="mes-label" htmlFor="mat-min">สั่งขั้นต่ำ</label>
                <input
                  id="mat-min"
                  className="mes-input"
                  type="number"
                  inputMode="decimal"
                  name="min_order_qty"
                  value={values.min_order_qty}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FieldError msg={touched.min_order_qty && errors.min_order_qty} />
              </div>
              <div className="sm:col-span-2">
                <label className="mes-label" htmlFor="mat-supplier">ผู้ขายหลัก</label>
                <input
                  id="mat-supplier"
                  className="mes-input"
                  name="default_supplier"
                  value={values.default_supplier}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
            </div>
          </Modal>
        );
      }}
    </Formik>
  );
};

FVMaterial.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

FVMaterial.defaultProps = {
  initialValues: null,
};

export default FVMaterial;
