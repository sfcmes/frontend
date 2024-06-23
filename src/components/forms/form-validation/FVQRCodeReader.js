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

  // State variables for alert and modal
  const [showAlert, setShowAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
    setDebugInfo(prev => prev + `\nDevice detected as ${isMobileDevice ? 'mobile' : 'desktop'}`);
  }, []);

  const handleScanClick = () => {
    console.log('Scan button clicked');
    setIsScanning(true);
    setFacingMode('environment');
    setDebugInfo(prev => prev + '\nScan button clicked, using environment (back) camera');
  };

  const handleScan = (result) => {
    if (result) {
      setQrCodeData(result.text);
      console.log('QR code data:', result.text);
      setIsScanning(false);
      setDebugInfo(prev => prev + `\nQR code scanned successfully: ${result.text}`);
      
      // Show alert and modal
      setShowAlert(true);
      setTimeout(() => setShowModal(true), 1000); // Show modal after 1 second
    } else {
      setDebugInfo(prev => prev + '\nScanning...');
    }
  };

  const handleError = (err) => {
    console.error(err);
    setIsScanning(false);
    setDebugInfo(prev => prev + `\nError during scanning: ${err.message}`);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    setUploadedQrCode(file);

    try {
      const data = await readQrCodeData(file);
      setUploadedQrCodeData(data);
      setDebugInfo(prev => prev + `\nQR code uploaded and read successfully: ${data}`);
    } catch (error) {
      console.error('Error reading QR code data:', error.message);
      setDebugInfo(prev => prev + `\nError reading uploaded QR code: ${error.message}`);
    }
  };

  const readQrCodeData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              resolve(code.data);
            } else {
              reject(new Error('No QR code found in the image'));
            }
          };
          img.onerror = () => {
            reject(new Error('Error loading image'));
          };
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
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
    <>
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
          <Button
            color="primary"
            variant="contained"
            onClick={handleScanClick}
            disabled={!isMobile}
          >
            Scan QR Code
          </Button>
          <Button
            color="primary"
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
        </Box>
      </Box>

      {/* Alert for scan completion */}
      <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
        <Alert onClose={() => setShowAlert(false)} severity="success" sx={{ width: '100%' }}>
          QR Code scanned successfully!
        </Alert>
      </Snackbar>

      {/* Modal dialog for scanned data */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>Scanned QR Code Data</DialogTitle>
        <DialogContent>
          <Typography>{qrCodeData}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FVQRCodeReader