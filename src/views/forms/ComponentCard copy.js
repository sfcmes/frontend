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
import { fetchProjectDetailsByComponentId, updateComponentStatus } from 'src/utils/api'; // Import the API function

const statusOrder = [
  'manufactured',
  'in_transit',
  'transported',
  'accepted'
];

const ComponentCard = ({ component, onOpenFile, onStatusChange }) => {
  const [projectDetails, setProjectDetails] = useState({ project_name: '', project_code: '' });
  const [statusHistory, setStatusHistory] = useState([]);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Fetch project details and status history when the component is loaded or updated
  useEffect(() => {
    const loadComponentData = async () => {
      try {
        const details = await fetchProjectDetailsByComponentId(component.id);
        setProjectDetails(details.projectDetails);
        setStatusHistory(details.statusHistory); // Assuming statusHistory is fetched from API
      } catch (error) {
        console.error('Failed to load component data:', error);
      }
    };

    loadComponentData();
  }, [component.id]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'manufactured':
        return { bg: 'primary.light', color: 'primary.main' };
      case 'in_transit':
        return { bg: 'warning.light', color: 'warning.main' };
      case 'transported':
        return { bg: 'secondary.light', color: 'secondary.main' };
      case 'accepted':
        return { bg: 'success.light', color: 'success.main' };
      case 'rejected':
        return { bg: 'error.light', color: 'error.main' };
      default:
        return { bg: 'grey.light', color: 'grey.main' };
    }
  };

  const statusStyle = getStatusStyle(component.status);

  const handleAccept = async () => {
    try {
      const currentStatusIndex = statusOrder.indexOf(component.status);
      if (currentStatusIndex < statusOrder.length - 1) {
        const nextStatus = statusOrder[currentStatusIndex + 1];
        await updateComponentStatus(component.id, nextStatus);
        onStatusChange(); // Trigger parent refresh
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Failed to update component status:', error);
    }
  };

  const handleRejectConfirm = async () => {
    try {
      await updateComponentStatus(component.id, 'rejected');
      setOpenRejectDialog(false);
      onStatusChange(); // Trigger parent refresh
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
              รหัส Component: {component.id}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ชื่อโครงการ: {projectDetails.project_name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              รหัสโครงการ: {projectDetails.project_code}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <Chip
            label={component.status}
            sx={{
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 'medium',
            }}
            size="small"
          />
          <Typography variant="body2" color="textSecondary">
            <CalendarTodayIcon fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
            อัพเดทล่าสุด: {new Date(component.updated_at).toLocaleDateString()}
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
          <Button
            size="large"
            variant="contained"
            color="primary"
            startIcon={<CheckCircleIcon />}
            onClick={handleAccept}
            fullWidth
            disabled={component.status === 'accepted' || component.status === 'rejected'}
          >
            รับชิ้นงาน
          </Button>
          <Button
            size="large"
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setOpenRejectDialog(true)}
            fullWidth
            disabled={component.status === 'rejected'}
          >
            ปฏิเสธชิ้นงาน
          </Button>
        </Stack>

        {/* Status History Display */}
        <Box mt={3}>
          <Typography variant="h6" fontWeight="500" mb={1}>
            ประวัติการเปลี่ยนแปลงสถานะ
          </Typography>
          {statusHistory.map((entry, index) => (
            <Typography key={index} variant="body2" color="textSecondary">
              {new Date(entry.timestamp).toLocaleDateString()}: {entry.status}
            </Typography>
          ))}
        </Box>

        {/* Reject Confirmation Dialog */}
        <Dialog
          open={openRejectDialog}
          onClose={() => setOpenRejectDialog(false)}
        >
          <DialogTitle>ยืนยันการปฏิเสธ</DialogTitle>
          <DialogContent>
            <DialogContentText>
              คุณแน่ใจว่าต้องการปฏิเสธชิ้นงานนี้หรือไม่? การดำเนินการนี้จะเปลี่ยนสถานะเป็น "ปฏิเสธ".
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

        {/* Snackbar */}
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="success">
            Component status updated!
          </Alert>
        </Snackbar>
      </CardContent>
    </BlankCard>
  );
};

export default ComponentCard;
