import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, IconButton, Grid, Typography, Box, Stack,
} from '@mui/material';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { fetchProjects } from 'src/utils/api';

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
      })
    )
    .min(1, 'ต้องมีรายการอย่างน้อย 1 รายการ'),
});

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

  const normalizeItems = (items) =>
    (items || []).map((it) => ({ ...it, _key: it._key ?? newItemKey() }));
  const start = initialValues
    ? { ...initialValues, items: normalizeItems(initialValues.items) }
    : blankValues(lockProjectId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
            <>
              <DialogTitle>{initialValues ? 'แก้ไขใบสั่งซื้อ' : 'สร้างใบสั่งซื้อวัตถุดิบ'}</DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select fullWidth label="โครงการ" name="projectId"
                      value={values.projectId} onChange={handleChange} onBlur={handleBlur}
                      disabled={Boolean(lockProjectId)}
                      error={touched.projectId && Boolean(errors.projectId)}
                      helperText={touched.projectId && errors.projectId}
                    >
                      {projects.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="อีเมลผู้จัดซื้อ" name="buyerEmail"
                      value={values.buyerEmail} onChange={handleChange} onBlur={handleBlur}
                      error={touched.buyerEmail && Boolean(errors.buyerEmail)}
                      helperText={touched.buyerEmail && errors.buyerEmail}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth type="date" label="กำหนดส่งที่ต้องการ"
                      InputLabelProps={{ shrink: true }}
                      name="requestedDeliveryDate"
                      value={values.requestedDeliveryDate || ''} onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth multiline minRows={2} label="หมายเหตุ" name="notes"
                      value={values.notes || ''} onChange={handleChange}
                    />
                  </Grid>
                </Grid>

                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>รายการวัสดุ</Typography>
                <FieldArray name="items">
                  {({ push, remove }) => (
                    <Stack spacing={1}>
                      {values.items.map((item, i) => {
                        const itErr = (errors.items && errors.items[i]) || {};
                        const itTouch = (touched.items && touched.items[i]) || {};
                        return (
                          <Grid container spacing={1} key={item._key} alignItems="flex-start">
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth size="small" label="ชื่อวัสดุ"
                                name={`items.${i}.materialName`}
                                value={item.materialName} onChange={handleChange} onBlur={handleBlur}
                                error={itTouch.materialName && Boolean(itErr.materialName)}
                                helperText={itTouch.materialName && itErr.materialName}
                              />
                            </Grid>
                            <Grid item xs={6} sm={2}>
                              <TextField
                                select fullWidth size="small" label="หน่วย"
                                name={`items.${i}.unit`}
                                value={item.unit} onChange={handleChange}
                              >
                                {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                              </TextField>
                            </Grid>
                            <Grid item xs={6} sm={2}>
                              <TextField
                                fullWidth size="small" type="number" label="จำนวน"
                                name={`items.${i}.quantity`}
                                value={item.quantity} onChange={handleChange} onBlur={handleBlur}
                                error={itTouch.quantity && Boolean(itErr.quantity)}
                                helperText={itTouch.quantity && itErr.quantity}
                              />
                            </Grid>
                            <Grid item xs={10} sm={3}>
                              <TextField
                                fullWidth size="small" label="หมายเหตุ"
                                name={`items.${i}.notes`}
                                value={item.notes || ''} onChange={handleChange}
                              />
                            </Grid>
                            <Grid item xs={2} sm={1}>
                              <IconButton
                                aria-label="remove"
                                onClick={() => values.items.length > 1 && remove(i)}
                              >
                                ✕
                              </IconButton>
                            </Grid>
                          </Grid>
                        );
                      })}
                      <Box>
                        <Button onClick={() => push({ ...EMPTY_ITEM, _key: newItemKey() })}>+ เพิ่มรายการ</Button>
                      </Box>
                    </Stack>
                  )}
                </FieldArray>
              </DialogContent>
              <DialogActions>
                <Button onClick={onClose}>ยกเลิก</Button>
                <Button variant="outlined" onClick={() => runWith(onSaveDraft)}>
                  บันทึก draft
                </Button>
                <Button variant="contained" onClick={() => runWith(onSubmitForReview)}>
                  ส่งให้ผู้จัดซื้อ
                </Button>
              </DialogActions>
            </>
          );
        }}
      </Formik>
    </Dialog>
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
