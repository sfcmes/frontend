import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Box, Button, Stack, Select, MenuItem, FormControl, InputLabel, Modal, Typography, Paper, Grid } from '@mui/material';
import CustomTextField from '../theme-elements/CustomTextField';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';

const validationSchema = yup.object({
  projectName: yup.string().required('กรุณากรอกชื่อโครงการ'),
  floor: yup.string().required('กรุณากรอกชั้น'),
  componentName: yup.string().required('กรุณากรอกชื่อชิ้นงาน'),
  componentNumber: yup.number().integer('เลขชิ้นงานต้องเป็นจำนวนเต็ม').min(1, 'เลขชิ้นงานต้องมีค่าอย่างน้อย 1').required('กรุณากรอกเลขชิ้นงาน'),
  componentType: yup.string().required('กรุณาเลือกประเภทชิ้นงาน'),
  width: yup.number().positive('ความกว้างต้องเป็นจำนวนบวก').required('กรุณากรอกความกว้างของชิ้นงาน'),
  height: yup.number().positive('ความสูงต้องเป็นจำนวนบวก').required('กรุณากรอกความสูงของชิ้นงาน'),
  thickness: yup.number().positive('ความหนาต้องเป็นจำนวนบวก').required('กรุณากรอกความหนาของชิ้นงาน'),
  extension: yup.number().positive('ส่วนขยายต้องเป็นจำนวนบวก').required('กรุณากรอกส่วนขยายของชิ้นงาน'),
  reduction: yup.number().positive('ส่วนลดต้องเป็นจำนวนบวก').required('กรุณากรอกส่วนลดของชิ้นงาน'),
  area: yup.number().positive('พื้นที่ต้องเป็นจำนวนบวก').required('กรุณากรอกพื้นที่ของชิ้นงาน'),
  volume: yup.number().positive('ปริมาตรต้องเป็นจำนวนบวก').required('กรุณากรอกปริมาตรของชิ้นงาน'),
  weight: yup.number().positive('น้ำหนักต้องเป็นจำนวนบวก').required('กรุณากรอกน้ำหนักของชิ้นงาน'),
  status: yup.string().oneOf(["Planning", "Fabrication", "Installed", "Completed", "Reject"]).required('กรุณาเลือกสถานะชิ้นงาน'),
  sectionId: yup.number().integer('เลขที่ส่วนต้องเป็นจำนวนเต็ม').min(1, 'เลขที่ส่วนต้องมีค่าอย่างน้อย 1').required('กรุณาเลือกเลขที่ส่วน'),
});

const FVComponent = ({
  componentNamePlaceholder = 'ชิ้นงาน A',
  componentNumberPlaceholder = '1',
  componentTypePlaceholder = 'ประเภท A',
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
  const [saveMessage, setSaveMessage] = useState('');

  const formik = useFormik({
    initialValues: {
      projectName: '',
      floor: '',
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
    onSubmit: async (values) => {
      const qrCodeDetails = `ชื่อโครงการ: ${values.projectName}, ชั้น: ${values.floor}, ชื่อชิ้นงาน: ${values.componentName}`;
      setQrCodeData(qrCodeDetails);
      setIsModalOpen(true);

      // สร้างและบันทึกไฟล์ JSON
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
        setSaveMessage('บันทึกไฟล์ JSON สำเร็จ');
        setTimeout(() => setSaveMessage(''), 1000);
      } else {
        setSaveMessage('เกิดข้อผิดพลาดในการบันทึกไฟล์ JSON');
        setTimeout(() => setSaveMessage(''), 1000);
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการบันทึกไฟล์ JSON:', error);
      setSaveMessage('เกิดข้อผิดพลาดในการบันทึกไฟล์ JSON กรุณาตรวจสอบคอนโซลสำหรับรายละเอียดเพิ่มเติม');
      setTimeout(() => setSaveMessage(''), 1000);
    }
  };

  const handleSave = async () => {
    const qrCodeElement = document.getElementById('qr-code');
    if (!qrCodeElement) {
      console.error('ไม่พบองค์ประกอบ QR code');
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
      console.error('เกิดข้อผิดพลาดในการบันทึกภาพ QR code:', error);
    }

    setIsModalOpen(false);
  };

  const handlePrint = () => {
    const qrCodeElement = document.getElementById('qr-code');
    if (!qrCodeElement) {
      console.error('ไม่พบองค์ประกอบ QR code');
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
        <CustomTextField
          fullWidth
          id="projectName"
          name="projectName"
          label="ชื่อโครงการ"
          value={formik.values.projectName}
          onChange={formik.handleChange}
          error={formik.touched.projectName && Boolean(formik.errors.projectName)}
          helperText={formik.touched.projectName && formik.errors.projectName}
        />
        <CustomTextField
          fullWidth
          id="floor"
          name="floor"
          label="ชั้น"
          value={formik.values.floor}
          onChange={formik.handleChange}
          error={formik.touched.floor && Boolean(formik.errors.floor)}
          helperText={formik.touched.floor && formik.errors.floor}
        />
        <CustomTextField
          fullWidth
          id="componentName"
          name="componentName"
          label="ชื่อชิ้นงาน"
          value={formik.values.componentName}
          onChange={formik.handleChange}
          error={formik.touched.componentName && Boolean(formik.errors.componentName)}
          helperText={formik.touched.componentName && formik.errors.componentName}
          placeholder={componentNamePlaceholder}
        />
        <CustomTextField
          fullWidth
          id="componentNumber"
          name="componentNumber"
          label="เลขชิ้นงาน"
          type="number"
          value={formik.values.componentNumber}
          onChange={formik.handleChange}
          error={formik.touched.componentNumber && Boolean(formik.errors.componentNumber)}
          helperText={formik.touched.componentNumber && formik.errors.componentNumber}
          placeholder={componentNumberPlaceholder}
        />
        <FormControl fullWidth>
          <InputLabel id="component-type-label">ประเภทชิ้นงาน</InputLabel>
          <Select
            labelId="component-type-label"
            id="componentType"
            name="componentType"
            value={formik.values.componentType}
            onChange={formik.handleChange}
            error={formik.touched.componentType && Boolean(formik.errors.componentType)}
          >
            <MenuItem value="">เลือกประเภทชิ้นงาน</MenuItem>
            <MenuItem value="Type A">ประเภท A-Precast</MenuItem>
            <MenuItem value="Type B">ประเภท B-เสาเอ็น</MenuItem>
            <MenuItem value="Type C">ประเภท C-ลูกขั้นบันได</MenuItem>
            <MenuItem value="Type D">ประเภท D-ท่อ</MenuItem>
          </Select>
        </FormControl>
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
          placeholder={widthPlaceholder}
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
          placeholder={heightPlaceholder}
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
          placeholder={thicknessPlaceholder}
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
          placeholder={extensionPlaceholder}
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
          placeholder={reductionPlaceholder}
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
          placeholder={areaPlaceholder}
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
          placeholder={volumePlaceholder}
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
          placeholder={weightPlaceholder}
        />
        <FormControl fullWidth>
          <InputLabel id="status-label">สถานะ</InputLabel>
          <Select
            labelId="status-label"
            id="status"
            name="status"
            value={formik.values.status}
            onChange={formik.handleChange}
            error={formik.touched.status && Boolean(formik.errors.status)}
          >
            <MenuItem value="">เลือกสถานะ</MenuItem>
            <MenuItem value="Planning">วางแผน</MenuItem>
            <MenuItem value="Fabrication">การผลิต</MenuItem>
            <MenuItem value="Installed">ติดตั้งแล้ว</MenuItem>
            <MenuItem value="Completed">เสร็จสมบูรณ์</MenuItem>
            <MenuItem value="Reject">ปฏิเสธ</MenuItem>
          </Select>
        </FormControl>
        <CustomTextField
          fullWidth
          id="sectionId"
          name="sectionId"
          label="เลขที่ส่วน"
          type="number"
          value={formik.values.sectionId}
          onChange={formik.handleChange}
          error={formik.touched.sectionId && Boolean(formik.errors.sectionId)}
          helperText={formik.touched.sectionId && formik.errors.sectionId}
          placeholder={sectionIdPlaceholder}
        />
      </Stack>
      <Box mt={3}>
        <Button color="primary" variant="contained" type="submit">
          สร้าง QR Code
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
                บันทึก
              </Button>
            </Grid>
            <Grid item>
              <Button onClick={handlePrint} variant="contained" color="secondary">
                พิมพ์
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </form>
  );
};

export default FVComponent;
