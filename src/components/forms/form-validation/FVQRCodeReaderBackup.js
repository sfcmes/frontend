import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import QrReader from 'react-qrcode-reader';

const FVQRCodeReader = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const qrReaderRef = useRef(null);

  useEffect(() => {
    // Detect if the user is on a mobile device
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
  }, []);

  const handleScan = (data) => {
    if (data) {
      setQrCodeData(data);
      setIsModalOpen(true);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setQrCodeData(e.target.result);
        setIsModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Button
        color="primary"
        variant="contained"
        onClick={() => setIsModalOpen(true)}
        disabled={isMobile}
      >
        {isMobile ? 'Scan QR Code' : 'Select QR Code File'}
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
            QR Code Data
          </Typography>
          <Typography id="modal-description" sx={{ mt: 2 }}>
            {qrCodeData}
          </Typography>
          {isMobile ? (
            <Box sx={{ mt: 2 }}>
              <QrReader
                ref={qrReaderRef}
                delay={300}
                onScan={handleScan}
                onError={handleError}
                style={{ width: '100%' }}
              />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <input type="file" onChange={handleFileSelect} />
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default FVQRCodeReader;