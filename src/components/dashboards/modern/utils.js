import React from 'react';
import { Box } from '@mui/material';

export const statusDisplayMap = {
  Manufactured: 'ผลิตแล้ว',
  'In Transit': 'อยู่ระหว่างขนส่ง',
  Transported: 'ขนส่งสำเร็จ',
  Accepted: 'ตรวจรับแล้ว',
  Installed: 'ติดตั้งแล้ว',
  Rejected: 'ถูกปฏิเสธ',
};

export const statusOrder = [
  'Manufactured',
  'In Transit',
  'Transported',
  'Accepted',
  'Installed',
  'Rejected',
];

export const getStatusColor = (status) => {
  switch (status) {
    case 'Manufactured':
      return { bg: 'primary.light', color: 'primary.main' };
    case 'In Transit':
      return { bg: 'warning.light', color: 'warning.main' };
    case 'Transported':
      return { bg: 'secondary.light', color: 'secondary.main' };
    case 'Accepted':
      return { bg: 'info.light', color: 'info.main' };
    case 'Installed':
      return { bg: 'success.light', color: 'success.main' };
    case 'Rejected':
      return { bg: 'error.light', color: 'error.main' };
    default:
      return { bg: 'grey.light', color: 'grey.main' };
  }
};

export const StatusChip = ({ status, label }) => {
  const { bg, color } = getStatusColor(status);
  return (
    <Box
      component="span"
      sx={{
        bgcolor: bg,
        color: color,
        fontWeight: 'bold',
        padding: '4px 8px',
        borderRadius: '16px',
        fontSize: { xs: '0.7rem', sm: '0.9rem' },
        display: 'inline-block',
        margin: '2px',
      }}
    >
      {label}
    </Box>
  );
};