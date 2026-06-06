import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Box, Button, Stack, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import CustomTextField from '../theme-elements/CustomTextField';
import CustomFormLabel from '../theme-elements/CustomFormLabel';
import { fetchProjects } from 'src/utils/api';

const validationSchema = yup.object({
  projectSelection: yup
    .string()
    .required('กรุณาเลือกโครงการ'),
  sectionName: yup
    .string()
    .min(2, 'Too Short!')
    .max(100, 'Too Long!')
    .required('กรุณาใส่ชื่อชั้น'),
  components: yup
    .number()
    .integer('Components must be an integer')
    .min(1, 'Components must be at least 1')
    .max(9999, 'Components must be less than or equal to 9999')
    .required('กรุณาใส่จำนวน Component'),
  status: yup
    .string()
    .oneOf(["planning", "in_progress", "completed", "on_hold"])
    .required('กรุณาเลือกสถานะของ Section'),
});

const FVSection = ({ onAddSection }) => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetchProjects();
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    loadProjects();
  }, []);

  const formik = useFormik({
    initialValues: {
      projectSelection: '',
      sectionName: '',
      components: '',
      status: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      const selectedProject = projects.find(p => `${p.project_code}-${p.id}` === values.projectSelection);
      const newSection = {
        project_id: selectedProject.id,
        name: values.sectionName,
        components: values.components,
        status: values.status,
      };
      onAddSection(newSection);
      formik.resetForm();
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Stack>
        <Box>
          <CustomFormLabel>รหัสโครงการ</CustomFormLabel>
          <FormControl fullWidth>
            <InputLabel id="projectSelection-label">เลือกรหัสโครงการ</InputLabel>
            <Select
              labelId="projectSelection-label"
              id="projectSelection"
              name="projectSelection"
              value={formik.values.projectSelection}
              onChange={formik.handleChange}
              error={formik.touched.projectSelection && Boolean(formik.errors.projectSelection)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={`${project.project_code}-${project.id}`}>
                  {project.project_code} - {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <CustomFormLabel>ชื่อชั้นในโครงการ</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="sectionName"
            name="sectionName"
            value={formik.values.sectionName}
            onChange={formik.handleChange}
            error={formik.touched.sectionName && Boolean(formik.errors.sectionName)}
            helperText={formik.touched.sectionName && formik.errors.sectionName}
          />
        </Box>
        <Box>
          <CustomFormLabel>จำนวนชิ้นงาน</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="components"
            name="components"
            type="number"
            value={formik.values.components}
            onChange={formik.handleChange}
            error={formik.touched.components && Boolean(formik.errors.components)}
            helperText={formik.touched.components && formik.errors.components}
            placeholder="10"
          />
        </Box>
        <Box>
          <CustomFormLabel>สถานะของชั้นในโครงการ</CustomFormLabel>
          <FormControl fullWidth>
            <InputLabel id="status-label">เลือกสถานะของชั้นในโครงการ</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              error={formik.touched.status && Boolean(formik.errors.status)}
            >
              <MenuItem value="">เลือกสถานะของ Section</MenuItem>
              <MenuItem value="planning">แผนผลิต</MenuItem>
              <MenuItem value="in_progress">ผลิต</MenuItem>
              <MenuItem value="completed">เสร็จแล้ว</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>
      <Button color="primary" variant="contained" type="submit">
        บันทึก Section เข้าระบบ
      </Button>
    </form>
  );
};

export default FVSection;