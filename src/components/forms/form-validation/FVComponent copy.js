import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Box, Button, Stack, Select, MenuItem, FormControl, InputLabel, Modal, Typography } from '@mui/material';
import CustomTextField from '../theme-elements/CustomTextField';
import CustomFormLabel from '../theme-elements/CustomFormLabel';
import QRCode from 'qrcode.react';

const validationSchema = yup.object({
  componentName: yup
    .string()
    .min(2, 'Too Short!')
    .max(255, 'Too Long!')
    .required('Please enter a component name'),
  componentNumber: yup
    .number()
    .integer('Component number must be an integer')
    .min(1, 'Component number must be at least 1')
    .required('Please enter a component number'),
  componentType: yup
    .string()
    .required('Please select a component type'),
  width: yup
    .number()
    .positive('Width must be a positive number')
    .required('Please enter the component width'),
  height: yup
    .number()
    .positive('Height must be a positive number')
    .required('Please enter the component height'),
  thickness: yup
    .number()
    .positive('Thickness must be a positive number')
    .required('Please enter the component thickness'),
  extension: yup
    .number()
    .positive('Extension must be a positive number')
    .required('Please enter the component extension'),
  reduction: yup
    .number()
    .positive('Reduction must be a positive number')
    .required('Please enter the component reduction'),
  area: yup
    .number()
    .positive('Area must be a positive number')
    .required('Please enter the component area'),
  volume: yup
    .number()
    .positive('Volume must be a positive number')
    .required('Please enter the component volume'),
  weight: yup
    .number()
    .positive('Weight must be a positive number')
    .required('Please enter the component weight'),
  status: yup
    .string()
    .oneOf(["Planning", "Fabrication", "Installed", "Completed", "Reject"])
    .required('Please select a component status'),
  sectionId: yup
    .number()
    .integer('Section ID must be an integer')
    .min(1, 'Section ID must be at least 1')
    .required('Please select a section'),
});

const FVComponent = ({
  componentNamePlaceholder = 'Component A',
  componentNumberPlaceholder = '1',
  componentTypePlaceholder = 'Type A',
  widthPlaceholder = '100',
  heightPlaceholder = '50',
  thicknessPlaceholder = '20',
  extensionPlaceholder = '10.5',
  reductionPlaceholder = '2.3',
  areaPlaceholder = '15.2',
  volumePlaceholder = '0.3',
  weightPlaceholder = '0.5',
  statusPlaceholder = 'Planning',
  sectionIdPlaceholder = '1',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);

  const formik = useFormik({
    initialValues: {
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
      sectionId: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      // Generate QR code data
      const qrCodeData = JSON.stringify(values);
      setQrCodeData(qrCodeData);
      setIsModalOpen(true);
    },
  });

  const handleSave = () => {
    // Implement save functionality
    console.log('Saving QR code:', qrCodeData);
    setIsModalOpen(false);
  };

  const handlePrint = () => {
    // Implement print functionality
    console.log('Printing QR code:', qrCodeData);
    setIsModalOpen(false);
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <Stack>
        <Box>
          <CustomFormLabel>Component Name</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="componentName"
            name="componentName"
            value={formik.values.componentName}
            onChange={formik.handleChange}
            error={formik.touched.componentName && Boolean(formik.errors.componentName)}
            helperText={formik.touched.componentName && formik.errors.componentName}
            placeholder={componentNamePlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Component Number</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="componentNumber"
            name="componentNumber"
            type="number"
            value={formik.values.componentNumber}
            onChange={formik.handleChange}
            error={formik.touched.componentNumber && Boolean(formik.errors.componentNumber)}
            helperText={formik.touched.componentNumber && formik.errors.componentNumber}
            placeholder={componentNumberPlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Component Type</CustomFormLabel>
          <FormControl fullWidth>
            <InputLabel id="component-type-label"></InputLabel>
            <Select
              labelId="component-type-label"
              id="componentType"
              name="componentType"
              value={formik.values.componentType}
              onChange={formik.handleChange}
              error={formik.touched.componentType && Boolean(formik.errors.componentType)}
            >
              <MenuItem value="">Select Component Type</MenuItem>
              <MenuItem value="Type A">{componentTypePlaceholder}</MenuItem>
              <MenuItem value="Type B">Type B</MenuItem>
              <MenuItem value="Type C">Type C</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box>
          <CustomFormLabel>Width (mm)</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="width"
            name="width"
            type="number"
            value={formik.values.width}
            onChange={formik.handleChange}
            error={formik.touched.width && Boolean(formik.errors.width)}
            helperText={formik.touched.width && formik.errors.width}
            placeholder={widthPlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Height (mm)</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="height"
            name="height"
            type="number"
            value={formik.values.height}
            onChange={formik.handleChange}
            error={formik.touched.height && Boolean(formik.errors.height)}
            helperText={formik.touched.height && formik.errors.height}
            placeholder={heightPlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Thickness (mm)</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="thickness"
            name="thickness"
            type="number"
            value={formik.values.thickness}
            onChange={formik.handleChange}
            error={formik.touched.thickness && Boolean(formik.errors.thickness)}
            helperText={formik.touched.thickness && formik.errors.thickness}
            placeholder={thicknessPlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Extension (sqm)</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="extension"
            name="extension"
            type="number"
            value={formik.values.extension}
            onChange={formik.handleChange}
            error={formik.touched.extension && Boolean(formik.errors.extension)}
            helperText={formik.touched.extension && formik.errors.extension}
            placeholder={extensionPlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Reduction (sqm)</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="reduction"
            name="reduction"
            type="number"
            value={formik.values.reduction}
            onChange={formik.handleChange}
            error={formik.touched.reduction && Boolean(formik.errors.reduction)}
            helperText={formik.touched.reduction && formik.errors.reduction}
            placeholder={reductionPlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Area (sqm)</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="area"
            name="area"
            type="number"
            value={formik.values.area}
            onChange={formik.handleChange}
            error={formik.touched.area && Boolean(formik.errors.area)}
            helperText={formik.touched.area && formik.errors.area}
            placeholder={areaPlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Volume (cubic m)</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="volume"
            name="volume"
            type="number"
            value={formik.values.volume}
            onChange={formik.handleChange}
            error={formik.touched.volume && Boolean(formik.errors.volume)}
            helperText={formik.touched.volume && formik.errors.volume}
            placeholder={volumePlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Weight (ton)</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="weight"
            name="weight"
            type="number"
            value={formik.values.weight}
            onChange={formik.handleChange}
            error={formik.touched.weight && Boolean(formik.errors.weight)}
            helperText={formik.touched.weight && formik.errors.weight}
            placeholder={weightPlaceholder}
          />
        </Box>
        <Box>
          <CustomFormLabel>Status</CustomFormLabel>
          <FormControl fullWidth>
            <InputLabel id="status-label"></InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              error={formik.touched.status && Boolean(formik.errors.status)}
            >
              <MenuItem value="">Select Status</MenuItem>
              <MenuItem value="Planning">{statusPlaceholder}</MenuItem>
              <MenuItem value="Fabrication">Fabrication</MenuItem>
              <MenuItem value="Installed">Installed</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Reject">Reject</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box>
          <CustomFormLabel>Section ID</CustomFormLabel>
          <CustomTextField
            fullWidth
            id="sectionId"
            name="sectionId"
            type="number"
            value={formik.values.sectionId}
            onChange={formik.handleChange}
            error={formik.touched.sectionId && Boolean(formik.errors.sectionId)}
            helperText={formik.touched.sectionId && formik.errors.sectionId}
            placeholder={sectionIdPlaceholder}
          />
        </Box>
      </Stack>
      <Button color="primary" variant="contained" type="submit">
        Save Component
      </Button>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
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
          <Typography id="modal-title" variant="h6" component="h2">
            QR Code Generated
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            {qrCodeData && <QRCode value={qrCodeData} />}
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handlePrint}>Print</Button>
          </Box>
        </Box>
      </Modal>
    </form>
  );
};

export default FVComponent;