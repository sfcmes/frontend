import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import {
  Box,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Modal,
  Typography,
  Paper,
  Grid,
  TextField,
} from '@mui/material';
import CustomTextField from '../theme-elements/CustomTextField';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';
import {
  fetchProjects,
  fetchSectionsByProjectId,
  fetchProjectById,
  fetchSectionById,
  createComponent,
} from 'src/utils/api';

const validationSchema = yup.object({
  projectName: yup.string().required('กรุณาใส่ชื่อโครงการ'),
  sectionId: yup.string().required('กรุณาเลือกส่วน'),
  componentName: yup.string().required('กรุณาใส่ชื่อชิ้นงาน'),
  componentType: yup.string().required('กรุณาเลือกประเภทชิ้นงาน'),
  width: yup.number().positive('ความกว้างต้องเป็นตัวเลข').required('กรุณาใส่ความกว้างของชิ้นงาน'),
  height: yup.number().positive('ความสูงต้องเป็นตัวเลข').required('กรุณาใส่ความสูงของชิ้นงาน'),
  thickness: yup.number().positive('ความหนาต้องเป็นตัวเลข').required('กรุณาใส่ความหนาของชิ้นงาน'),
  extension: yup.number().min(0, 'ส่วนขยายต้องเป็นตัวเลข').required('กรุณาใส่ส่วนขยายของชิ้นงาน'),
  reduction: yup.number().min(0, 'ส่วนลดต้องเป็นตัวเลข').required('กรุณาใส่ส่วนลดของชิ้นงาน'),
  area: yup.number().positive('พื้นที่ต้องเป็นตัวเลข').required('กรุณาใส่พื้นที่ของชิ้นงาน'),
  volume: yup.number().positive('ปริมาตรต้องเป็นตัวเลข').required('กรุณาใส่ปริมาตรของชิ้นงาน'),
  weight: yup.number().positive('น้ำหนักต้องเป็นตัวเลข').required('กรุณาใส่น้ำหนักของชิ้นงาน'),
  status: yup.string().oneOf(['Planning', 'Fabrication', 'Installed', 'Completed', 'Reject']).required('กรุณาเลือกสถานะของชิ้นงาน'),
  file: yup.mixed().required('กรุณาอัปโหลดไฟล์ PDF')
});

const FVComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [projects, setProjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectResponse = await fetchProjects();
        setProjects(projectResponse.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchData();
  }, []);

  const handleProjectChange = async (event) => {
    const projectId = event.target.value;
    formik.setFieldValue('projectName', projectId);

    try {
      const sectionResponse = await fetchSectionsByProjectId(projectId);
      setSections(sectionResponse.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleFileChange = (event) => {
    formik.setFieldValue('file', event.currentTarget.files[0]);
};

const formik = useFormik({
  initialValues: {
    projectName: '',
    sectionId: '',
    componentName: '',
    componentType: '',
    width: '',
    height: '',
    thickness: '',
    extension: '',
    reduction: '',
    area: '',
    volume: '',
    weight: '',
    status: '',
    file: null
  },
  validationSchema: validationSchema,
  onSubmit: async (values) => {
    setError('');
    console.log('Submitting form with values:', values);
    try {
      const formData = new FormData();
      formData.append('section_id', values.sectionId);
      formData.append('name', values.componentName);
      formData.append('type', values.componentType);
      formData.append('width', values.width);
      formData.append('height', values.height);
      formData.append('thickness', values.thickness);
      formData.append('extension', values.extension);
      formData.append('reduction', values.reduction);
      formData.append('area', values.area);
      formData.append('volume', values.volume);
      formData.append('weight', values.weight);
      formData.append('status', values.status);
      formData.append('file', values.file);

      const response = await createComponent(formData);
      const component = response.data;

      const projectResponse = await fetchProjectById(values.projectName);
      const sectionResponse = await fetchSectionById(values.sectionId);

      const qrCodeDetails = `โครงการ: ${projectResponse.data.name}\nชั้น: ${sectionResponse.data.name}\nชื่อชิ้นงาน: ${values.componentName}\n`;
      setQrCodeData(qrCodeDetails);
      setIsModalOpen(true);

    } catch (error) {
      console.error('Error creating component or fetching project/section details:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  },
});


  const handleSave = async () => {
    const qrCodeElement = document.getElementById('qr-code');
    if (!qrCodeElement) {
      console.error('QR code element not found');
      return;
    }

    try {
      const canvas = await html2canvas(qrCodeElement);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'qr-code.png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 'image/png');
    } catch (error) {
      console.error('Error saving QR code image:', error);
    }

    setIsModalOpen(false);
  };

  const handlePrint = () => {
    const qrCodeElement = document.getElementById('qr-code');
    if (!qrCodeElement) {
      console.error('QR code element not found');
      return;
    }

    html2canvas(qrCodeElement).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '', 'height=400,width=600');
      printWindow.document.write('<html><head><title>QR Code</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<img src="${imgData}" />`);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    });

    setIsModalOpen(false);
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <Stack spacing={3}>
        {error && <Typography color="error">{error}</Typography>}
        <FormControl fullWidth>
          <InputLabel id="project-name-label">โครงการ</InputLabel>
          <Select
            labelId="project-name-label"
            id="projectName"
            name="projectName"
            value={formik.values.projectName}
            onChange={handleProjectChange}
            error={formik.touched.projectName && Boolean(formik.errors.projectName)}
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="section-id-label">ชั้น</InputLabel>
          <Select
            labelId="section-id-label"
            id="sectionId"
            name="sectionId"
            value={formik.values.sectionId}
            onChange={formik.handleChange}
            error={formik.touched.sectionId && Boolean(formik.errors.sectionId)}
          >
            {sections.map((section) => (
              <MenuItem key={section.id} value={section.id}>
                {section.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <CustomTextField
          fullWidth
          id="componentName"
          name="componentName"
          label="ชื่อชิ้นงาน"
          value={formik.values.componentName}
          onChange={formik.handleChange}
          error={formik.touched.componentName && Boolean(formik.errors.componentName)}
          helperText={formik.touched.componentName && formik.errors.componentName}
        />
        <CustomTextField
          fullWidth
          id="componentType"
          name="componentType"
          label="ประเภทของชิ้นงาน"
          value={formik.values.componentType}
          onChange={formik.handleChange}
          error={formik.touched.componentType && Boolean(formik.errors.componentType)}
          helperText={formik.touched.componentType && formik.errors.componentType}
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
          id="extension"
          name="extension"
          label="ส่วนขยาย (ตร.ม.)"
          type="number"
          value={formik.values.extension}
          onChange={formik.handleChange}
          error={formik.touched.extension && Boolean(formik.errors.extension)}
          helperText={formik.touched.extension && formik.errors.extension}
        />
        <CustomTextField
          fullWidth
          id="reduction"
          name="reduction"
          label="ส่วนลด (ตร.ม.)"
          type="number"
          value={formik.values.reduction}
          onChange={formik.handleChange}
          error={formik.touched.reduction && Boolean(formik.errors.reduction)}
          helperText={formik.touched.reduction && formik.errors.reduction}
        />
        <CustomTextField
          fullWidth
          id="area"
          name="area"
          label="พื้นที่ (ตร.ม.)"
          type="number"
          value={formik.values.area}
          onChange={formik.handleChange}
          error={formik.touched.area && Boolean(formik.errors.area)}
          helperText={formik.touched.area && formik.errors.area}
        />
        <CustomTextField
          fullWidth
          id="volume"
          name="volume"
          label="ปริมาตร (ลบ.ม.)"
          type="number"
          value={formik.values.volume}
          onChange={formik.handleChange}
          error={formik.touched.volume && Boolean(formik.errors.volume)}
          helperText={formik.touched.volume && formik.errors.volume}
        />
        <CustomTextField
          fullWidth
          id="weight"
          name="weight"
          label="น้ำหนัก (ตัน)"
          type="number"
          value={formik.values.weight}
          onChange={formik.handleChange}
          error={formik.touched.weight && Boolean(formik.errors.weight)}
          helperText={formik.touched.weight && formik.errors.weight}
        />
        <FormControl fullWidth>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="status"
            name="status"
            value={formik.values.status}
            onChange={formik.handleChange}
            error={formik.touched.status && Boolean(formik.errors.status)}
          >
            <MenuItem value="">เลือก Status</MenuItem>
            <MenuItem value="Planning">แผนผลิต</MenuItem>
            <MenuItem value="Fabrication">ผลิต</MenuItem>
            <MenuItem value="In Transit">กำลังขนส่ง</MenuItem>
            <MenuItem value="Installed">ติดตั้งแล้ว</MenuItem>
            <MenuItem value="Reject">Reject</MenuItem>
          </Select>
        </FormControl>
        <TextField
          id="file"
          name="file"
          type="file"
          onChange={handleFileChange}
          error={formik.touched.file && Boolean(formik.errors.file)}
          helperText={formik.touched.file && formik.errors.file}
        />
      </Stack>
      <Box mt={3}>
        <Button color="primary" variant="contained" type="submit">
          Generate QR Code
        </Button>
      </Box>
      {saveMessage && (
        <Box mt={2}>
          <Typography color="primary">{saveMessage}</Typography>
        </Box>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="qr-code-modal"
        aria-describedby="qr-code-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="qr-code-modal" variant="h6" component="h2" align="center">
            QR Code
          </Typography>
          <Paper
            id="qr-code"
            elevation={3}
            sx={{ mt: 2, p: 2, textAlign: 'center', backgroundColor: 'white' }}
          >
            <QRCode value={qrCodeData} size={256} />
            <Typography mt={2} variant="body1">
              {qrCodeData}
            </Typography>
          </Paper>
          <Grid container spacing={2} justifyContent="center" mt={2}>
            <Grid item>
              <Button onClick={handleSave} variant="contained" color="primary">
                Save
              </Button>
            </Grid>
            <Grid item>
              <Button onClick={handlePrint} variant="contained" color="secondary">
                Print
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </form>
  );
};

export default FVComponent;
