import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  TextField,
} from '@mui/material';
import {
  fetchComponentByQR,
  updateComponentStatus,
  fetchComponentFiles,
  openFile,
  publicApi,
  checkUsernameAndRole,
} from 'src/utils/api';
import ComponentCard from './ComponentCard';

const FormComponentCard = () => {
  const { id } = useParams();
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchComponentData = async () => {
    try {
      setLoading(true);
      const componentData = await fetchComponentByQR(id);
      const filesData = await fetchComponentFiles(id);
      setComponent({ ...componentData, files: filesData });
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลชิ้นงานได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponentData();
  }, [id]);

  const handleVerifyUser = async () => {
    if (!username) {
      setUsernameError('กรุณาใส่ชื่อผู้ใช้งาน');
      return;
    }
    try {
      const { isValid, role } = await checkUsernameAndRole(username);
      if (isValid) {
        setIsAdmin(role === 'Admin');
        setIsUserVerified(true);
        setUsernameError('');
      } else {
        setUsernameError('ชื่อผู้ใช้งานไม่ถูกต้อง');
        setIsUserVerified(false);
      }
    } catch (err) {
      setError('ไม่สามารถตรวจสอบชื่อผู้ใช้งานได้');
      console.error(err);
      setIsUserVerified(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isUserVerified) {
      setUsernameError('กรุณายืนยันชื่อผู้ใช้งานก่อน');
      return;
    }
    setConfirmDialog({ open: true, action: () => updateStatus(newStatus) });
  };

  const updateStatus = async (newStatus) => {
    try {
      await updateComponentStatus(id, newStatus, username);
      await fetchComponentData();
    } catch (err) {
      setError('ไม่สามารถอัพเดทสถานะชิ้นงานได้');
      console.error(err);
    }
  };

  const handleFileOpen = async (fileUrl) => {
    try {
      await openFile(fileUrl);
    } catch (err) {
      setError('ไม่สามารถเปิดไฟล์ได้');
      console.error(err);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!component) return <Typography>ไม่พบข้อมูลชิ้นงาน</Typography>;

  return (
    <Box sx={{ padding: isMobile ? 2 : 4 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <TextField
          label="ชื่อผู้ใช้งาน"
          variant="outlined"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setUsernameError('');
            setIsUserVerified(false);
          }}
          error={!!usernameError}
          helperText={usernameError}
          fullWidth
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleVerifyUser}
          disabled={!username}
        >
          ตกลง
        </Button>
      </Box>
      {isUserVerified && (
        <Typography color="success.main" mb={2}>
          ยืนยันตัวตนสำเร็จ {isAdmin ? '(Admin)' : '(ผู้ใช้ทั่วไป)'}
        </Typography>
      )}
      <ComponentCard
        component={component}
        onStatusChange={(newStatus) => handleStatusChange(newStatus)}
        onOpenFile={handleFileOpen}
        disableActions={!isUserVerified}
        isAdmin={isAdmin}
      />

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
      >
        <DialogTitle>ยืนยันการเปลี่ยนสถานะ</DialogTitle>
        <DialogContent>
          <Typography>คุณแน่ใจว่าต้องการเปลี่ยนสถานะของชิ้นงานนี้หรือไม่?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: null })} color="primary">
            ยกเลิก
          </Button>
          <Button
            onClick={() => {
              if (confirmDialog.action) {
                confirmDialog.action();
              }
              setConfirmDialog({ open: false, action: null });
            }}
            color="error"
          >
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormComponentCard;