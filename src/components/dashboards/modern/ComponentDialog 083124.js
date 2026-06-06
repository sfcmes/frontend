import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  fetchComponentById,
  fetchUserById,
  downloadFile,
  openFile,
  updateComponent,
  fetchUserProfile,
} from 'src/utils/api';

const ComponentDialog = memo(({ open, onClose, component, projectCode }) => {
  const [tabValue, setTabValue] = useState(0);
  const [componentDetails, setComponentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileError, setFileError] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [userRole, setUserRole] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [highlightStatus, setHighlightStatus] = useState(false);

  const fieldNameMap = {
    id: 'id',
    section_id: 'section_id',
    name: 'ชื่อชิ้นงาน',
    type: 'ประเภทชิ้นงาน',
    width: 'ความกว้าง (มม.)',
    height: 'ความสูง (มม.)',
    thickness: 'ความหนา (มม.)',
    extension: 'ส่วนขยาย (ตร.ม.)',
    reduction: 'ส่วนลด (ตร.ม.)',
    area: 'พื้นที่ (ตร.ม.)',
    volume: 'ปริมาตร (ลบ.ม.)',
    created_at: 'สร้างเมื่อ',
    updated_at: 'อัปเดตเมื่อ',
    status: 'สถานะ',
    weight: 'น้ำหนัก'
  };

  const getThaiFieldName = (fieldName) => {
    return fieldNameMap[fieldName] || fieldName;
  };

  const statusDisplayMap = {
    manufactured: 'ผลิตแล้ว',
    in_transit: 'อยู่ระหว่างขนส่ง',
    transported: 'ขนส่งสำเร็จ',
    accepted: 'ตรวจรับแล้ว',
    installed: 'ติดตั้งแล้ว',
    rejected: 'ถูกปฏิเสธ',
  };
  

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [details, userProfile] = await Promise.all([
          fetchComponentById(component.id),
          fetchUserProfile(),
        ]);
  
        const historyWithUsernames = await Promise.all(
          details.history.map(async (item) => {
            const user = await fetchUserById(item.updated_by);
            return { ...item, username: user.username };
          }),
        );
  
        setComponentDetails({ ...details, history: historyWithUsernames });
        setUserRole(userProfile.role);
        setNewStatus(details.status);
      } catch (error) {
        console.error('Error fetching component details:', error);
        if (error.response && error.response.status === 401) {
          setSnackbarMessage('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
          setSnackbarOpen(true);
          // Implement a function to redirect to login page
          // redirectToLogin();
        } else {
          setError('ไม่สามารถโหลดข้อมูลชิ้นงานได้ กรุณาลองใหม่อีกครั้ง');
        }
      } finally {
        setLoading(false);
      }
    };
  
    if (open && component.id) {
      fetchDetails();
    }
  }, [open, component.id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileDownload = async () => {
    if (componentDetails && componentDetails.file_path) {
      try {
        await downloadFile(componentDetails.file_path);
      } catch (error) {
        console.error('Error downloading file:', error);
        setFileError(true);
        setSnackbarMessage('ไม่สามารถดาวน์โหลดไฟล์ได้ กรุณาลองใหม่ภายหลัง');
        setSnackbarOpen(true);
      }
    }
  };

  const handleFileOpen = async () => {
    if (componentDetails && componentDetails.file_path) {
      try {
        await openFile(componentDetails.file_path);
      } catch (error) {
        console.error('Error opening file:', error);
        setFileError(true);
        setSnackbarMessage('ไม่สามารถเปิดไฟล์ได้ กรุณาลองใหม่ภายหลัง');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleStatusChange = (event) => {
    setNewStatus(event.target.value);
  };

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateComponent(component.id, { status: newStatus });
      
      // Refresh component details
      const updatedDetails = await fetchComponentById(component.id);
      setComponentDetails(updatedDetails);

      setSnackbarMessage('อัพเดทสถานะเรียบร้อยแล้ว');
      setSnackbarOpen(true);
      
      // Highlight the updated status
      setHighlightStatus(true);
      setTimeout(() => setHighlightStatus(false), 2000);
    } catch (error) {
      console.error('Error updating status:', error);
      let errorMessage = 'ไม่สามารถอัพเดทสถานะได้ กรุณาลองใหม่';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'ไม่พบชิ้นงาน อาจถูกลบไปแล้ว';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusOptions = () => {
    if (userRole === 'Admin') {
      return [
        { value: 'Manufactured', label: 'ผลิตแล้ว' },
        { value: 'In Transit', label: 'อยู่ระหว่างขนส่ง' },
        { value: 'Rejected', label: 'ปฏิเสธ' },
      ];
    } else if (userRole === 'Site User') {
      return [
        { value: 'Accepted', label: 'ตรวจรับแล้ว' },
        { value: 'Installed', label: 'ติดตั้งแล้ว' },
        { value: 'Rejected', label: 'ปฏิเสธ' },
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography color="error">{error}</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>รายละเอียด: {componentDetails?.name}</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="รายละเอียดชิ้นงาน" />
            <Tab label="ประวัติสถานะ" />
            <Tab label="อัพเดทสถานะ" />
          </Tabs>
          {tabValue === 0 && componentDetails && (
            <>
              <Table size="small">
                <TableBody>
                  {Object.entries(componentDetails).map(([key, value]) => {
                    if (key !== 'history' && typeof value !== 'object') {
                      return (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row">
                            {getThaiFieldName(key)}
                          </TableCell>
                          <TableCell align="right">
                            {key === 'created_at' || key === 'updated_at'
                              ? new Date(value).toLocaleString('th-TH')
                              : key === 'status'
                              ? (
                                <Typography
                                  style={{
                                    backgroundColor: highlightStatus ? '#4caf50' : 'transparent',
                                    transition: 'background-color 0.3s',
                                    padding: '5px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  {statusDisplayMap[value] || value}
                                </Typography>
                              )
                              : value.toString()}
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return null;
                  })}
                </TableBody>
              </Table>
              {componentDetails.file_path && (
                <Box mt={2} display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<GetAppIcon />}
                    onClick={handleFileDownload}
                    disabled={fileError}
                  >
                    {fileError ? 'ไฟล์ไม่พร้อมใช้งาน' : 'ดาวน์โหลดไฟล์'}
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<VisibilityIcon />}
                    onClick={handleFileOpen}
                    disabled={fileError}
                  >
                    {fileError ? 'ไฟล์ไม่พร้อมใช้งาน' : 'เปิดไฟล์'}
                  </Button>
                </Box>
              )}
            </>
          )}
          {tabValue === 1 && componentDetails && componentDetails.history && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>วันที่อัปเดต</TableCell>
                  <TableCell>อัปเดตโดย</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {componentDetails.history.map((historyItem, index) => (
                  <TableRow key={index}>
                    <TableCell>{statusDisplayMap[historyItem.status] || historyItem.status}</TableCell>
                    <TableCell>{new Date(historyItem.updated_at).toLocaleString('th-TH')}</TableCell>
                    <TableCell>{historyItem.username}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {tabValue === 2 && (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'site user') && (
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                อัพเดทสถานะ
              </Typography>
              <Select
                value={newStatus}
                onChange={handleStatusChange}
                fullWidth
                margin="normal"
              >
                {getStatusOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <Button
                variant="contained"
                color="primary"
                onClick={handleStatusUpdate}
                disabled={isUpdating}
                sx={{ mt: 2 }}
              >
                {isUpdating ? 'กำลังอัพเดท...' : 'อัพเดทสถานะ'}
              </Button>
            </Box>
          )}
          {tabValue === 2 && !(userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'site user') && (
            <Typography color="error" mt={2}>
              คุณไม่มีสิทธิ์ในการอัพเดทสถานะ
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
});

export default ComponentDialog;