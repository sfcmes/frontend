import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid 
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  'Component Number': Yup.number().positive().integer().required('Component Number is required'),
  'Component Name': Yup.string().required('Component Name is required'),
  'Component Type': Yup.string().required('Component Type is required'),
  'Width (mm)': Yup.number().positive().required('Width is required'),
  'Height (mm)': Yup.number().positive().required('Height is required'),
  'Thickness (mm)': Yup.number().positive().required('Thickness is required'),
  'Extension (sqm)': Yup.number().positive().required('Extension is required'),
  'Reduction (sqm)': Yup.number().positive().required('Reduction is required'),
  'Area (sqm)': Yup.number().positive().required('Area is required'),
  'Volume (m³)': Yup.number().positive().required('Volume is required'),
  'Weight (ton)': Yup.number().positive().required('Weight is required'),
  'Status': Yup.string().required('Status is required'),
  'Section ID': Yup.number().positive().integer().required('Section ID is required'),
});

const EditDialog = ({ open, onClose, row, onSave }) => {
  const formik = useFormik({
    initialValues: row,
    validationSchema: validationSchema,
    onSubmit: (values) => {
      onSave(values);
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>แก้ไขข้อมูลส่วนประกอบ</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            {Object.keys(row).map((key) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  fullWidth
                  id={key}
                  name={key}
                  label={key}
                  value={formik.values[key]}
                  onChange={formik.handleChange}
                  error={formik.touched[key] && Boolean(formik.errors[key])}
                  helperText={formik.touched[key] && formik.errors[key]}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button type="submit" variant="contained" color="primary">
            บันทึก
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditDialog;