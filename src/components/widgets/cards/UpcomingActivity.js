import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { Stack, Typography, Avatar, Box, Button, Modal } from '@mui/material';
import DashboardCard from '../../shared/DashboardCard';
import { IconDatabase, IconMail, IconMapPin, IconPhone, IconScreenShare } from '@tabler/icons';
import QrReader from 'react-qrcode-reader';

const FVQRCodeReader = () => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primarylight = theme.palette.primary.light;
  const error = theme.palette.error.main;
  const errorlight = theme.palette.error.light;
  const warning = theme.palette.warning.main;
  const warninglight = theme.palette.warning.light;
  const secondary = theme.palette.secondary.main;
  const secondarylight = theme.palette.secondary.light;
  const success = theme.palette.success.main;
  const successlight = theme.palette.success.light;

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

  const stats = [
    {
      title: 'Trip to singapore',
      subtitle: 'working on',
      time: 5,
      color: primary,
      lightcolor: primarylight,
      icon: <IconMapPin width={20} />,
    },
    {
      title: 'Archived Data',
      subtitle: 'working on',
      time: 10,
      color: secondary,
      lightcolor: secondarylight,
      icon: <IconDatabase width={20} />,
    },
    {
      title: 'Meeting with client',
      subtitle: 'pending',
      time: 15,
      color: warning,
      lightcolor: warninglight,
      icon: <IconPhone width={20} />,
    },
    {
      title: 'Screening Task Team',
      subtitle: 'working on',
      time: 20,
      color: error,
      lightcolor: errorlight,
      icon: <IconScreenShare width={20} />,
    },
    {
      title: 'Send envelope to John',
      subtitle: 'done',
      time: 20,
      color: success,
      lightcolor: successlight,
      icon: <IconMail width={20} />,
    },
  ];

  return (
    <>
      <DashboardCard title="Upcoming Activity" subtitle="In New year">
        <Stack spacing={3} mt={5}>
          {stats.map((stat, i) => (
            <Stack direction="row" spacing={3} justifyContent="space-between" alignItems="center" key={i}>
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
                {stat.time} mins
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DashboardCard>

      <Button color="primary" variant="contained" onClick={() => setIsModalOpen(true)} disabled={!isMobile}>
        Scan QR Code
      </Button>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} aria-labelledby="modal-title" aria-describedby="modal-description">
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
          {isMobile && (
            <Box sx={{ mt: 2 }}>
              <QrReader ref={qrReaderRef} delay={300} onScan={handleScan} onError={handleError} style={{ width: '100%' }} />
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default FVQRCodeReader;