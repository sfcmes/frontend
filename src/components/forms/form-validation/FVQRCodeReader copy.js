import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Stack, Typography, Avatar, Box, Button, Input, Paper, Divider,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { IconMapPin, IconUpload } from '@tabler/icons';
import { QrReader } from 'react-qr-reader';
import jsQR from 'jsqr';

const FVQRCodeReader = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primarylight = theme.palette.primary.light;

  const [qrCodeData, setQrCodeData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedQrCode, setUploadedQrCode] = useState(null);
  const [uploadedQrCodeData, setUploadedQrCodeData] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [debugInfo, setDebugInfo] = useState('');
  const fileInputRef = useRef(null);

  // State variables for modal and alert
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [scanningMessage, setScanningMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
    setDebugInfo(`Device detected as ${isMobileDevice ? 'mobile' : 'desktop'}`);
  }, []);

  const handleScanClick = () => {
    setIsScanning(true);
    setFacingMode('environment');
    setScanningMessage('Scanning...');
  };

  const handleScan = (result) => {
    if (result) {
      const scannedData = result.text;
      setQrCodeData(scannedData);
      setIsScanning(false);
      setScanningMessage('');
      setModalData(scannedData);
      setShowModal(true);
      setAlertMessage('QR Code scanned successfully!');
      setShowAlert(true);
    }
  };

  const handleError = (err) => {
    console.error(err);
    setIsScanning(false);
    setScanningMessage('');
    setAlertMessage(`Error: ${err.message}`);
    setShowAlert(true);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    setUploadedQrCode(file);

    try {
      const data = await readQrCodeData(file);
      setUploadedQrCodeData(data);
      setModalData(data);
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
            reject(new Error('No QR code found in the image'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleAccept = async () => {
    setShowModal(false);
    try {
      const response = await fetch('http://localhost:3033/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: modalData, status: status }),
      });

      if (response.ok) {
        setAlertMessage('Status updated successfully!');
        setShowAlert(true);
      } else {
        setAlertMessage('Error updating status');
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setAlertMessage('Error updating status. Please check the console for details.');
      setShowAlert(true);
    }
  };

  const handleReject = () => {
    setQrCodeData(null);
    setUploadedQrCodeData(null);
    setShowModal(false);
  };

  const isJsonString = (str) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  const formatData = (data) => {
    if (isJsonString(data)) {
      return JSON.stringify(JSON.parse(data), null, 2);
    }
    return data;
  };

  const stats = [
    {
      title: 'Scanned QR Code Data',
      subtitle: qrCodeData || 'No data scanned',
      time: qrCodeData ? qrCodeData.length : 0,
      color: primary,
      lightcolor: primarylight,
      icon: <IconMapPin width={20} />,
    },
    {
      title: 'Uploaded QR Code Data',
      subtitle: uploadedQrCodeData || 'No data uploaded',
      time: uploadedQrCodeData ? uploadedQrCodeData.length : 0,
      color: primary,
      lightcolor: primarylight,
      icon: <IconUpload width={20} />,
      image: uploadedQrCode ? URL.createObjectURL(uploadedQrCode) : null,
    },
  ];

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
      <Paper elevation={3} sx={{ p: 3, width: '100%' }}>
        <Stack spacing={3}>
          {stats.map((stat, i) => (
            <Box key={i}>
              <Stack direction="row" spacing={3} justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar variant="rounded" sx={{ bgcolor: stat.lightcolor, color: stat.color, width: 40, height: 40 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" mb="4px">
                      {stat.title}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="subtitle2" color="textSecondary">
                  {stat.time} chars
                </Typography>
              </Stack>
              {stat.image && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <img src={stat.image} alt="Uploaded QR Code" style={{ maxWidth: '100%', maxHeight: 200 }} />
                </Box>
              )}
              {i < stats.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button color="primary" variant="contained" onClick={handleScanClick} disabled={!isMobile}>
          Scan QR Code
        </Button>
        <Button color="primary" variant="contained" onClick={() => fileInputRef.current.click()}>
          Upload QR Code
        </Button>
        <Input type="file" inputRef={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />
      </Stack>

      {isMobile && isScanning && (
        <Box sx={{ mt: 2, width: '100%' }}>
          <QrReader
            delay={300}
            onResult={handleScan}
            onError={handleError}
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

      <Box sx={{ mt: 2, width: '100%', whiteSpace: 'pre-wrap' }}>
        <Typography variant="h6">Debug Information:</Typography>
        <Typography variant="body2">{debugInfo}</Typography>
        {scanningMessage && (
          <Typography variant="body2" sx={{ mt: 1 }}>{scanningMessage}</Typography>
        )}
      </Box>

      {/* Modal dialog for scanned/uploaded data */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>QR Code Data</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Raw Data:</Typography>
          <Typography variant="body1" paragraph>{modalData || 'No data available'}</Typography>
          <Typography variant="h6" gutterBottom>Formatted Data:</Typography>
          <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {modalData ? formatData(modalData) : 'No data available'}
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>Update Status:</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {['Planning', 'Fabrication', 'Installed', 'Completed', 'Reject'].map((statusOption) => (
              <Button
                key={statusOption}
                variant="outlined"
                color={status === statusOption ? 'primary' : 'default'}
                onClick={() => setStatus(statusOption)}
              >
                {statusOption}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReject} color="error">Reject</Button>
          <Button onClick={handleAccept} color="primary">Accept</Button>
        </DialogActions>
      </Dialog>

      {/* Alert for notifications */}
      <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
        <Alert onClose={() => setShowAlert(false)} severity="info" sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FVQRCodeReader;
