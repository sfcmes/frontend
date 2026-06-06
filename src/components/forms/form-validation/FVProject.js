// FVProject.js
import React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Box, Button, Stack, FormControl, InputLabel, TextField, Select, MenuItem } from '@mui/material';
import CustomTextField from '../theme-elements/CustomTextField';
import CustomFormLabel from '../theme-elements/CustomFormLabel';

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
    .oneOf(["Planning", "In Progress", "Completed", "On Hold"])
    .required('กรุณาใส่จำนวนชั้นของโครงการ'),
});

const FVProject = ({ onAddProject }) => {
  const formik = useFormik({
    initialValues: {
      projectName: '',
      projectCode: '',
      section: '',
      status: '',
    },
    validationSchema: validationSchema,
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
    <form onSubmit={formik.handleSubmit}>
      <Stack>
        <Box>
          <CustomFormLabel>ชื่อโครงการ</CustomFormLabel>
          <TextField
            fullWidth
            id="projectName"
            name="projectName"
            label="กรอกชื่อโครงการ"
            value={formik.values.projectName}
            onChange={formik.handleChange}
            error={formik.touched.projectName && Boolean(formik.errors.projectName)}
            helperText={formik.touched.projectName && formik.errors.projectName}
          />
        </Box>
        <Box>
          <CustomFormLabel>รหัสโครงการ</CustomFormLabel>
          <TextField
            fullWidth
            id="projectCode"
            name="projectCode"
            label="กรอกรหัสของโครงการ"
            value={formik.values.projectCode}
            onChange={formik.handleChange}
            error={formik.touched.projectCode && Boolean(formik.errors.projectCode)}
            helperText={formik.touched.projectCode && formik.errors.projectCode}
            // placeholder="รหัสของโครงการ"
          />
        </Box>
        <Box>
          <CustomFormLabel>จำนวนชั้นของโครงการ</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="section"
            name="section"
            label="กรอกจำนวนชั้นทั้งหมดของโครงการ"
            type="number"
            value={formik.values.section}
            onChange={formik.handleChange}
            error={formik.touched.section && Boolean(formik.errors.section)}
            helperText={formik.touched.section && formik.errors.section}
            // placeholder="จำนวนชั้นทั้งหมดในโครงการ"
          />
        </Box>
        <Box>
          <CustomFormLabel>สถานะโครงการ</CustomFormLabel>
          <FormControl fullWidth>
            <InputLabel id="status-label">สถานะโครงการ</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              error={formik.touched.status && Boolean(formik.errors.status)}
            >
              <MenuItem value="">เลือกสถานะโครงการ</MenuItem>
              <MenuItem value="Planning">Planning</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="On Hold">On Hold</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>
      <Button color="primary" variant="contained" type="submit">
        บันทึกโครงการเข้าระบบ
      </Button>
    </form>
  );
};

export default FVProject;
