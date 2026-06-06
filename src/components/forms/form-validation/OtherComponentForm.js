import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Box,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
} from '@mui/material';
import CustomTextField from '../theme-elements/CustomTextField';
import { createOtherComponent } from 'src/utils/api';

const validationSchema = yup.object({
  project_id: yup.string().required('กรุณาเลือกโครงการ'),
  name: yup.string().required('กรุณาใส่ชื่อชิ้นงาน'),
  width: yup.number().positive('ความกว้างต้องเป็นตัวเลขบวก').required('กรุณาใส่ความกว้างของชิ้นงาน'),
  height: yup.number().positive('ความสูงต้องเป็นตัวเลขบวก').required('กรุณาใส่ความสูงของชิ้นงาน'),
  thickness: yup.number().positive('ความหนาต้องเป็นตัวเลขบวก').required('กรุณาใส่ความหนาของชิ้นงาน'),
  total_quantity: yup.number().positive('จำนวนต้องเป็นตัวเลขบวก').required('กรุณาใส่จำนวนของชิ้นงาน'),
});

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
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setError('');
      setSuccess('');
      setIsSubmitting(true);
      try {
        const response = await createOtherComponent(values);
        console.log('New other component created:', response);
        setSuccess('ชิ้นงานอื่นๆ ถูกสร้างเรียบร้อยแล้ว');
        onComponentAdded(response); // Notify parent component about the new component
        formik.resetForm(); // Reset the form after successful submission
      } catch (error) {
        console.error('Error creating component:', error);
        setError('เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองอีกครั้ง');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Stack spacing={3}>
        {error && <Typography color="error">{error}</Typography>}
        {success && <Typography color="success.main">{success}</Typography>}
        <FormControl fullWidth>
          <InputLabel id="project-id-label">โครงการ</InputLabel>
          <Select
            labelId="project-id-label"
            id="project_id"
            name="project_id"
            value={formik.values.project_id}
            onChange={(event) => {
              formik.setFieldValue('project_id', event.target.value);
              onProjectChange(event);
            }}
            error={formik.touched.project_id && Boolean(formik.errors.project_id)}
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <CustomTextField
          fullWidth
          id="name"
          name="name"
          label="ชื่อชิ้นงาน"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />

        <CustomTextField
          fullWidth
          id="width"
          name="width"
          label="ความกว้าง (มม.)"
          type="number"
          value={formik.values.width}
          onChange={formik.handleChange}
          error={formik.touched.width && Boolean(formik.errors.width)}
          helperText={formik.touched.width && formik.errors.width}
        />
        <CustomTextField
          fullWidth
          id="height"
          name="height"
          label="ความสูง (มม.)"
          type="number"
          value={formik.values.height}
          onChange={formik.handleChange}
          error={formik.touched.height && Boolean(formik.errors.height)}
          helperText={formik.touched.height && formik.errors.height}
        />
        <CustomTextField
          fullWidth
          id="thickness"
          name="thickness"
          label="ความหนา (มม.)"
          type="number"
          value={formik.values.thickness}
          onChange={formik.handleChange}
          error={formik.touched.thickness && Boolean(formik.errors.thickness)}
          helperText={formik.touched.thickness && formik.errors.thickness}
        />
        <CustomTextField
          fullWidth
          id="total_quantity"
          name="total_quantity"
          label="จำนวน"
          type="number"
          value={formik.values.total_quantity}
          onChange={formik.handleChange}
          error={formik.touched.total_quantity && Boolean(formik.errors.total_quantity)}
          helperText={formik.touched.total_quantity && formik.errors.total_quantity}
        />

        <Box mt={3}>
          <Button
            color="primary"
            variant="contained"
            type="submit"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            บันทึก
          </Button>
        </Box>
      </Stack>
    </form>
  );
};

export default OtherComponentForm;