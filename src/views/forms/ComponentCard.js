import React, { useEffect, useState } from 'react';
import {
  CardContent,
  Typography,
  Button,
  Box,
  Stack,
  Avatar,
  AvatarGroup,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
} from '@mui/material';
import BlankCard from '../../components/shared/BlankCard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DescriptionIcon from '@mui/icons-material/Description';
import { fetchProjectDetailsByComponentId, updateComponentStatus } from 'src/utils/api';

const statusTranslation = {
  planning: 'รอผลิต',
  manufactured: 'ผลิตแล้ว',
  transported: 'อยู่ระหว่างขนส่ง',
  accepted: 'ตรวจรับแล้ว',
  installed: 'ติดตั้งแล้ว',
  rejected: 'ถูกปฏิเสธ',
};

const statusOrder = ['planning', 'manufactured', 'transported', 'accepted', 'installed'];

const ComponentCard = ({ component, onOpenFile, onStatusChange, disableActions, isAdmin }) => {
  const [projectDetails, setProjectDetails] = useState({ project_name: '', project_code: '' });
  const [statusHistory, setStatusHistory] = useState([]);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const loadComponentData = async () => {
      try {
        const details = await fetchProjectDetailsByComponentId(component.id);
        setProjectDetails(details.projectDetails);
        setStatusHistory(details.statusHistory || []);
      } catch (error) {
        console.error('Failed to load component data:', error);
        setStatusHistory([]);
      }
    };

    loadComponentData();
  }, [component.id]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'planning': return { bg: 'info.light', color: 'info.main' };
      case 'manufactured': return { bg: 'primary.light', color: 'primary.main' };
      case 'transported': return { bg: 'warning.light', color: 'warning.main' };
      case 'accepted': return { bg: 'success.light', color: 'success.main' };
      case 'installed': return { bg: 'secondary.light', color: 'secondary.main' };
      case 'rejected': return { bg: 'error.light', color: 'error.main' };
      default: return { bg: 'grey.light', color: 'grey.main' };
    }
  };

  const statusStyle = getStatusStyle(component.status);

  const getNextStatus = (currentStatus) => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const handleAccept = async () => {
    if (disableActions) return;
    try {
      let newStatus;
      if (isAdmin) {
        newStatus = getNextStatus(component.status);
      } else if (component.status === 'transported') {
        newStatus = 'accepted';
      }

      if (newStatus) {
        await onStatusChange(newStatus);
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Failed to update component status:', error);
    }
  };

  const handleRejectConfirm = async () => {
    if (disableActions) return;
    try {
      await onStatusChange('rejected');
      setOpenRejectDialog(false);
    } catch (error) {
      console.error('Failed to reject component:', error);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const canAccept = isAdmin || component.status === 'transported';
  const nextStatus = getNextStatus(component.status);

  return (
    <BlankCard>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main', mr: 2 }}>
            {component.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="500">
              {component.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              รหัสชิ้นงาน: {component.id}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <Chip
            label={statusTranslation[component.status] || component.status}
            sx={{
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 'medium',
            }}
            size="small"
          />
          <Typography variant="body2" color="textSecondary">
            <CalendarTodayIcon fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
            อัพเดทล่าสุด: {new Date(component.updated_at).toLocaleDateString('th-TH')}
          </Typography>
        </Stack>

        <Typography variant="body2" mb={3}>
          {component.description}
        </Typography>

        <Stack direction="row" spacing={2} mb={3}>
          <AvatarGroup max={3}>
            {component.files &&
              component.files.map((file, index) => (
                <Avatar key={index} sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <DescriptionIcon fontSize="small" />
                </Avatar>
              ))}
          </AvatarGroup>
          <Typography variant="body2" color="textSecondary" alignSelf="center">
            {component.files ? component.files.length : 0} ไฟล์แบบ
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {canAccept && (isAdmin ? nextStatus : true) && (
            <Button
              size="large"
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={handleAccept}
              fullWidth
              disabled={disableActions || component.status === 'installed'}
            >
              {isAdmin 
                ? `อัพเดทเป็น ${statusTranslation[nextStatus]}`
                : 'ยอมรับชิ้นงาน'}
            </Button>
          )}
          <Button
            size="large"
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setOpenRejectDialog(true)}
            fullWidth
            disabled={component.status === 'rejected' || disableActions}
          >
            ปฏิเสธชิ้นงาน
          </Button>
          <Button
            size="large"
            variant="text"
            color="primary"
            startIcon={<DescriptionIcon />}
            onClick={() => {
              const fileUrl =
                component.files && component.files.length > 0 ? component.files[0].s3_url : null;
              if (fileUrl) {
                onOpenFile(fileUrl);
              }
            }}
            fullWidth
            disabled={!component.files || component.files.length === 0}
          >
            เปิดไฟล์แบบล่าสุด
          </Button>
        </Stack>

        <Box mt={3}>
          <Typography variant="h6" fontWeight="500" mb={1}>
            ประวัติการเปลี่ยนแปลงสถานะ
          </Typography>
          {statusHistory && statusHistory.length > 0 ? (
            statusHistory.map((entry, index) => (
              <Typography key={index} variant="body2" color="textSecondary">
                {new Date(entry.timestamp).toLocaleDateString('th-TH')}: {statusTranslation[entry.status] || entry.status}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              ไม่มีประวัติการเปลี่ยนแปลงสถานะ
            </Typography>
          )}
        </Box>

        <Dialog
          open={openRejectDialog}
          onClose={() => setOpenRejectDialog(false)}
        >
          <DialogTitle>ยืนยันการปฏิเสธ</DialogTitle>
          <DialogContent>
            <DialogContentText>
              คุณแน่ใจว่าต้องการปฏิเสธชิ้นงานนี้หรือไม่? การดำเนินการนี้จะเปลี่ยนสถานะเป็น "ปฏิเสธ"
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRejectDialog(false)} color="primary">
              ยกเลิก
            </Button>
            <Button onClick={handleRejectConfirm} color="error">
              ยืนยัน
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="success">
            อัพเดทสถานะชิ้นงานเรียบร้อยแล้ว!
          </Alert>
        </Snackbar>
      </CardContent>
    </BlankCard>
  );
};

export default ComponentCard;