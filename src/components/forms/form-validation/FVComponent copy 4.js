import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Box, Button, Stack, Select, MenuItem, FormControl, InputLabel, Modal, Typography, Paper, Grid } from '@mui/material';
import CustomTextField from '../theme-elements/CustomTextField';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';
import { fetchProjects, fetchSectionsByProjectId } from 'src/utils/api';

const validationSchema = yup.object({
  projectName: yup.string().required('Please enter a project name'),
  sectionId: yup.string().required('Please select a section'),
  componentName: yup.string().required('Please enter a component name'),
  componentNumber: yup.number().integer('Component number must be an integer').min(1, 'Component number must be at least 1').required('Please enter a component number'),
  componentType: yup.string().required('Please select a component type'),
  width: yup.number().positive('Width must be a positive number').required('Please enter the component width'),
  height: yup.number().positive('Height must be a positive number').required('Please enter the component height'),
  thickness: yup.number().positive('Thickness must be a positive number').required('Please enter the component thickness'),
  extension: yup.number().positive('Extension must be a positive number').required('Please enter the component extension'),
  reduction: yup.number().positive('Reduction must be a positive number').required('Please enter the component reduction'),
  area: yup.number().positive('Area must be a positive number').required('Please enter the component area'),
  volume: yup.number().positive('Volume must be a positive number').required('Please enter the component volume'),
  weight: yup.number().positive('Weight must be a positive number').required('Please enter the component weight'),
  status: yup.string().oneOf(["Planning", "Fabrication", "Installed", "Completed", "Reject"]).required('Please select a component status'),
});

const FVComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [projects, setProjects] = useState([]);
  const [sections, setSections] = useState([]);

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

  const formik = useFormik({
    initialValues: {
      projectName: '',
      sectionId: '',
      componentName: '',
      componentNumber: '',
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
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const qrCodeDetails = `Project: ${values.projectName}, Section/Floor: ${values.sectionId}, Component: ${values.componentName}`;
      setQrCodeData(qrCodeDetails);
      setIsModalOpen(true);

      await createAndSaveJSON(values);
    },
  });

  const createAndSaveJSON = async (data) => {
    const record = {
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('http://localhost:3033/save-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });

      if (response.ok) {
        setSaveMessage('JSON file saved successfully');
        setTimeout(() => setSaveMessage(''), 1000);
      } else {
        setSaveMessage('Error saving JSON file');
        setTimeout(() => setSaveMessage(''), 1000);
      }
    } catch (error) {
      console.error('Error saving JSON file:', error);
      setSaveMessage('Error saving JSON file. Please check the console for details.');
      setTimeout(() => setSaveMessage(''), 1000);
    }
  };

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
        <FormControl fullWidth>
          <InputLabel id="project-name-label">Project Name</InputLabel>
          <Select
            labelId="project-name-label"
            id="projectName"
            name="projectName"
            value={formik.values.projectName}
            onChange={handleProjectChange}
            error={formik.touched.projectName && Boolean(formik.errors.projectName)}
          >
            <MenuItem value="">Select Project</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="section-id-label">Section/Floor</InputLabel>
          <Select
            labelId="section-id-label"
            id="sectionId"
            name="sectionId"
            value={formik.values.sectionId}
            onChange={formik.handleChange}
            error={formik.touched.sectionId && Boolean(formik.errors.sectionId)}
          >
            <MenuItem value="">Select Section/Floor</MenuItem>
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
          label="Component Name"
          value={formik.values.componentName}
          onChange={formik.handleChange}
          error={formik.touched.componentName && Boolean(formik.errors.componentName)}
          helperText={formik.touched.componentName && formik.errors.componentName}
        />
        <CustomTextField
          fullWidth
          id="componentNumber"
          name="componentNumber"
          label="Component Number"
          type="number"
          value={formik.values.componentNumber}
          onChange={formik.handleChange}
          error={formik.touched.componentNumber && Boolean(formik.errors.componentNumber)}
          helperText={formik.touched.componentNumber && formik.errors.componentNumber}
        />
        <FormControl fullWidth>
          <InputLabel id="component-type-label">Component Type</InputLabel>
          <Select
            labelId="component-type-label"
            id="componentType"
            name="componentType"
            value={formik.values.componentType}
            onChange={formik.handleChange}
            error={formik.touched.componentType && Boolean(formik.errors.componentType)}
          >
            <MenuItem value="">Select Component Type</MenuItem>
            <MenuItem value="Type A">Type A-Precast</MenuItem>
            <MenuItem value="Type B">Type B-เสาเอ็น</MenuItem>
            <MenuItem value="Type C">Type C-ลูกขั้นบันได</MenuItem>
            <MenuItem value="Type D">Type D-ท่อ</MenuItem>
          </Select>
        </FormControl>
        <CustomTextField
          fullWidth
          id="width"
          name="width"
          label="Width (mm)"
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
          label="Height (mm)"
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
          label="Thickness (mm)"
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
          label="Extension (sq.m)"
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
          label="Reduction (sq.m)"
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
          label="Area (sq.m)"
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
          label="Volume (cu.m)"
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
          label="Weight (tons)"
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
            <MenuItem value="">Select Status</MenuItem>
            <MenuItem value="Planning">Planning</MenuItem>
            <MenuItem value="Fabrication">Fabrication</MenuItem>
            <MenuItem value="Installed">Installed</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Reject">Reject</MenuItem>
          </Select>
        </FormControl>
        
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
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="qr-code-modal" variant="h6" component="h2" align="center">
            QR Code
          </Typography>
          <Paper id="qr-code" elevation={3} sx={{ mt: 2, p: 2, textAlign: 'center', backgroundColor: 'white' }}>
            <QRCode value={qrCodeData} size={256} />
            <Typography mt={2} variant="body1">{qrCodeData}</Typography>
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
