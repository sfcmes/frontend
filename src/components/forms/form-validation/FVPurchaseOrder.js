// [MES] FVPurchaseOrder — PO create/edit form (Formik + Yup, FieldArray line items).
// Validation schema and save semantics identical to previous implementation.
import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { fetchProjects } from 'src/utils/api';
import { Modal } from 'src/components/mes/ui';
import { Icon } from 'src/components/mes/Icon';

const UNITS = ['m³', 'kg', 'ชิ้น', 'ม.', 'อื่นๆ'];

const EMPTY_ITEM = { materialName: '', unit: 'ชิ้น', quantity: '', notes: '' };

let _itemKeySeq = 0;
const newItemKey = () => `it-${_itemKeySeq++}`;

const blankValues = (lockProjectId) => ({
  projectId: lockProjectId || '',
  buyerEmail: '',
  requestedDeliveryDate: '',
  notes: '',
  items: [{ ...EMPTY_ITEM, _key: newItemKey() }],
});

const schema = Yup.object({
  projectId: Yup.string().required('กรุณาเลือกโครงการ'),
  buyerEmail: Yup.string().email('อีเมลไม่ถูกต้อง').required('กรุณากรอกอีเมลผู้จัดซื้อ'),
  requestedDeliveryDate: Yup.string().nullable(),
  notes: Yup.string().nullable(),
  items: Yup.array()
    .of(
      Yup.object({
        materialName: Yup.string().required('ระบุชื่อวัสดุ'),
        unit: Yup.string().required(),
        quantity: Yup.number().typeError('ตัวเลข').positive('> 0').required('ระบุจำนวน'),
        notes: Yup.string().nullable(),
      }),
    )
    .min(1, 'ต้องมีรายการอย่างน้อย 1 รายการ'),
});

const FieldError = ({ msg }) => (msg ? <div className="mt-1 text-xs text-sem-danger">{msg}</div> : null);
FieldError.propTypes = { msg: PropTypes.node };
FieldError.defaultProps = { msg: null };

const FVPurchaseOrder = ({
  open, onClose, initialValues, lockProjectId, onSaveDraft, onSubmitForReview,
}) => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (!open) return;
    fetchProjects()
      .then((res) => setProjects(res.data || []))
      .catch(() => setProjects([]));
  }, [open]);

  const start = useMemo(() => {
    if (!initialValues) return blankValues(lockProjectId);
    const items = (initialValues.items || []).map((it) => ({ ...it, _key: it._key ?? newItemKey() }));
    return { ...initialValues, items };
  }, [initialValues, lockProjectId]);

  return (
    <Formik
      initialValues={start}
      validationSchema={schema}
      enableReinitialize
      onSubmit={() => {}}
    >
      {({ values, errors, touched, handleChange, handleBlur, validateForm, setTouched }) => {
        const runWith = async (action) => {
          const errs = await validateForm();
          if (Object.keys(errs).length > 0) {
            setTouched({
              projectId: true, buyerEmail: true,
              items: values.items.map(() => ({ materialName: true, quantity: true })),
            });
            return;
          }
          const cleanValues = {
            ...values,
            items: values.items.map((it) => {
              const clean = { ...it };
              delete clean._key;
              return clean;
            }),
          };
          await action(cleanValues);
        };

        return (
          <Modal
            open={open}
            onClose={onClose}
            wide
            title={initialValues ? 'แก้ไขใบสั่งซื้อ' : 'สร้างใบสั่งซื้อวัตถุดิบ'}
            footer={
              <>
                <button className="mes-btn mes-btn-ghost" onClick={onClose}>ยกเลิก</button>
                <button className="mes-btn mes-btn-ghost" onClick={() => runWith(onSaveDraft)}>บันทึก draft</button>
                <button className="mes-btn mes-btn-primary" onClick={() => runWith(onSubmitForReview)}>ส่งให้ผู้จัดซื้อ</button>
              </>
            }
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mes-label" htmlFor="po-project">โครงการ</label>
                <select
                  id="po-project"
                  className="mes-input"
                  name="projectId"
                  value={values.projectId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={Boolean(lockProjectId)}
                >
                  <option value="">—</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <FieldError msg={touched.projectId && errors.projectId} />
              </div>
              <div>
                <label className="mes-label" htmlFor="po-email">อีเมลผู้จัดซื้อ</label>
                <input
                  id="po-email"
                  className="mes-input"
                  type="email"
                  name="buyerEmail"
                  value={values.buyerEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <FieldError msg={touched.buyerEmail && errors.buyerEmail} />
              </div>
              <div>
                <label className="mes-label" htmlFor="po-date">กำหนดส่งที่ต้องการ</label>
                <input
                  id="po-date"
                  className="mes-input"
                  type="date"
                  name="requestedDeliveryDate"
                  value={values.requestedDeliveryDate || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mes-label" htmlFor="po-notes">หมายเหตุ</label>
                <textarea
                  id="po-notes"
                  className="mes-input"
                  rows={2}
                  name="notes"
                  value={values.notes || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-5 mb-2 text-sm font-semibold">รายการวัสดุ</div>
            <FieldArray name="items">
              {({ push, remove }) => (
                <div className="flex flex-col gap-3">
                  {values.items.map((item, i) => {
                    const itErr = (errors.items && errors.items[i]) || {};
                    const itTouch = (touched.items && touched.items[i]) || {};
                    return (
                      <div key={item._key} className="rounded-md border border-mes-border p-3">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_110px_110px_1fr_auto]">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="mes-label">ชื่อวัสดุ</label>
                            <input
                              className="mes-input"
                              name={`items.${i}.materialName`}
                              value={item.materialName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <FieldError msg={itTouch.materialName && itErr.materialName} />
                          </div>
                          <div>
                            <label className="mes-label">หน่วย</label>
                            <select
                              className="mes-input"
                              name={`items.${i}.unit`}
                              value={item.unit}
                              onChange={handleChange}
                            >
                              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mes-label">จำนวน</label>
                            <input
                              className="mes-input"
                              type="number"
                              inputMode="decimal"
                              name={`items.${i}.quantity`}
                              value={item.quantity}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <FieldError msg={itTouch.quantity && itErr.quantity} />
                          </div>
                          <div>
                            <label className="mes-label">หมายเหตุ</label>
                            <input
                              className="mes-input"
                              name={`items.${i}.notes`}
                              value={item.notes || ''}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              className="mes-btn mes-btn-ghost !px-3"
                              aria-label="ลบรายการ"
                              onClick={() => values.items.length > 1 && remove(i)}
                            >
                              <Icon name="x" size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div>
                    <button
                      type="button"
                      className="mes-btn mes-btn-ghost"
                      onClick={() => push({ ...EMPTY_ITEM, _key: newItemKey() })}
                    >
                      <Icon name="plus" size={15} /> เพิ่มรายการ
                    </button>
                  </div>
                </div>
              )}
            </FieldArray>
          </Modal>
        );
      }}
    </Formik>
  );
};

FVPurchaseOrder.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  lockProjectId: PropTypes.string,
  onSaveDraft: PropTypes.func.isRequired,
  onSubmitForReview: PropTypes.func.isRequired,
};

FVPurchaseOrder.defaultProps = {
  initialValues: null,
  lockProjectId: null,
};

export default FVPurchaseOrder;
