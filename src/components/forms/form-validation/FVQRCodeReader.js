import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Stack, Typography, Box, Button, Input, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableRow, Snackbar, Alert
} from '@mui/material';
import { IconQrcode, IconUpload, IconDownload } from '@tabler/icons';
import { QrReader } from 'react-qr-reader';
import jsQR from 'jsqr';
import { updateComponent, fetchComponentById } from 'src/utils/api';  // Adjust this import path as needed

const statusFlow = {
  Manufactured: 'In Transit',
  'In Transit': 'Transported',
  Transported: 'Accepted',
  Accepted: 'Installed',
  Installed: 'Installed',
  Rejected: 'Rejected',
  pending: 'Manufactured'
};

const statusDisplayMap = {
  Manufactured: 'ผลิตแล้ว',
  'In Transit': 'อยู่ระหว่างขนส่ง',
  Transported: 'ขนส่งสำเร็จ',
  Accepted: 'ตรวจรับแล้ว',
  Installed: 'ติดตั้งแล้ว',
  Rejected: 'ถูกปฏิเสธ',
  pending: 'รอดำเนินการ'
};

const thaiTranslations = {
  project: 'โครงการ',
  section: 'ส่วน',
  name: 'ชื่อ',
  type: 'ประเภท',
  width: 'ความกว้าง',
  height: 'ความสูง',
  thickness: 'ความหนา',
  extension: 'ส่วนขยาย',
  reduction: 'ส่วนลด',
  area: 'พื้นที่',
  volume: 'ปริมาตร',
  weight: 'น้ำหนัก',
  status: 'สถานะ'
};

const FVQRCodeReader = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const [qrCodeData, setQrCodeData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedQrCode, setUploadedQrCode] = useState(null);
  const [uploadedQrCodeData, setUploadedQrCodeData] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [debugInfo, setDebugInfo] = useState('');
  const fileInputRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [scanningMessage, setScanningMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [componentData, setComponentData] = useState(null);
  const [nextStatus, setNextStatus] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
    setDebugInfo(`Detected device: ${isMobileDevice ? 'Mobile' : 'Desktop'}`);
  }, []);

  const handleScanClick = () => {
    setIsScanning(true);
    setFacingMode('environment');
    setScanningMessage('Scanning...');
    setError(null);
  };

  const handleScan = async (result) => {
    if (result) {
      console.log('QR code scanned:', result);
      try {
        const scannedData = JSON.parse(result.text);
        console.log('Parsed QR code data:', scannedData);
        setQrCodeData(scannedData);
        setIsScanning(false);
        setScanningMessage('');

        // Fetch component data from API
        const component = await fetchComponentById(scannedData.id);
        console.log('Fetched component data:', component);
        setComponentData(component);
        setNextStatus(statusFlow[component.status] || '');
        setModalData(JSON.stringify(component, null, 2));
        setShowModal(true);
        setAlertMessage('QR Code scanned successfully!');
        setShowAlert(true);
      } catch (error) {
        console.error('Error processing QR code data:', error);
        setError(`Error processing QR code data: ${error.message}`);
        setIsScanning(false);
        setScanningMessage('');
      }
    }
  };

  const handleError = (err) => {
    console.error('QR code scanning error:', err);
    setIsScanning(false);
    setScanningMessage('');
    setError(`Scanning error: ${err.message}`);
    setShowAlert(true);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    setUploadedQrCode(file);

    try {
      const data = await readQrCodeData(file);
      const parsedData = JSON.parse(data); // Assuming the data is a JSON string
      setUploadedQrCodeData(parsedData);
      setModalData(parsedData);
      setShowModal(true);
      setAlertMessage('QR Code uploaded and read successfully!');
      setShowAlert(true);
    } catch (error) {
      console.error('Error reading QR code data:', error.message);
      setAlertMessage(`Error: ${error.message}`);
      setShowAlert(true);
    }
  };

  const readQrCodeData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            resolve(code.data);
          } else {
            reject(new Error('QR code not found in the image'));
          }
        };
        img.onerror = () => reject(new Error('Unable to load image'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleAccept = async () => {
    if (!componentData || !nextStatus) {
      setAlertMessage('No component data or next status');
      setShowAlert(true);
      return;
    }

    try {
      const updatedComponent = await updateComponent(componentData.id, { status: nextStatus });
      setComponentData(updatedComponent);
      setNextStatus(statusFlow[updatedComponent.status] || '');
      setAlertMessage(`Status updated to ${statusDisplayMap[updatedComponent.status]}`);
      setShowAlert(true);
    } catch (error) {
      console.error('Error updating component status:', error);
      setAlertMessage('Error updating component status');
      setShowAlert(true);
    }
  };

  const handleReject = async () => {
    if (!componentData) {
      setAlertMessage('No component data');
      setShowAlert(true);
      return;
    }

    try {
      const updatedComponent = await updateComponent(componentData.id, { status: 'Rejected' });
      setComponentData(updatedComponent);
      setNextStatus('');
      setAlertMessage('Component status set to Rejected');
      setShowAlert(true);
    } catch (error) {
      console.error('Error rejecting component:', error);
      setAlertMessage('Error rejecting component');
      setShowAlert(true);
    }
  };

  const handleDownloadPDF = () => {
    if (componentData && componentData.file_path) {
      window.open(componentData.file_path, '_blank');
    } else {
      setAlertMessage('PDF file not found for download');
      setShowAlert(true);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      mt: 5,
      mx: { xs: 2, md: 'auto' },
      maxWidth: '100%',
      width: 600,
    }}>
      <Paper elevation={3} sx={{ p: 3, width: '100%', mb: 3 }}>
        <Typography variant="h5" gutterBottom>QR Code Reader System</Typography>
        <Typography variant="body2" color="textSecondary" paragraph>{debugInfo}</Typography>
        
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button 
            startIcon={<IconQrcode />}
            color="primary" 
            variant="contained" 
            onClick={handleScanClick} 
            disabled={!isMobile}
          >
            Scan QR Code
          </Button>
          <Button 
            startIcon={<IconUpload />}
            color="secondary" 
            variant="contained" 
            onClick={() => fileInputRef.current.click()}
          >
            Upload QR Code
          </Button>
          <Input 
            type="file" 
            inputRef={fileInputRef} 
            onChange={handleUpload} 
            style={{ display: 'none' }} 
          />
        </Stack>
  
        {isMobile && isScanning && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <QrReader
              delay={300}
              onResult={(result, error) => {
                if (result) {
                  console.log('Scan result:', result);
                  handleScan(result);
                }
                if (error) {
                  console.error('Scan error:', error);
                  handleError(error);
                }
              }}
              style={{ width: '100%' }}
              constraints={{
                facingMode: facingMode,
                aspectRatio: 1,
                width: { min: 360, ideal: 640, max: 1920 },
                height: { min: 360, ideal: 640, max: 1080 },
              }}
            />
          </Box>
        )}
  
        {scanningMessage && (
          <Typography variant="body2" sx={{ mt: 2 }}>{scanningMessage}</Typography>
        )}
  
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        )}
  
        {qrCodeData && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Last Scanned Data:</Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(qrCodeData, null, 2)}
            </Typography>
          </Box>
        )}
      </Paper>
  
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>Component Information</DialogTitle>
        <DialogContent>
          <Typography variant="h6">Raw Data:</Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(uploadedQrCodeData, null, 2)}
          </Typography>
          <Typography variant="h6">Formatted Data:</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                {modalData && Object.entries(modalData).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell component="th" scope="row">
                      {thaiTranslations[key] || key}
                    </TableCell>
                    <TableCell align="right">
                      {key === 'status' ? statusDisplayMap[value] : value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReject} color="error">ปฏิเสธ</Button>
          <Button 
            onClick={handleAccept} 
            color="primary" 
            disabled={!nextStatus || componentData?.status === 'Installed'}
          >
            {nextStatus ? `ยอมรับ (${statusDisplayMap[nextStatus]})` : 'ยอมรับ'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
        <Alert onClose={() => setShowAlert(false)} severity="info" sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default FVQRCodeReader;
