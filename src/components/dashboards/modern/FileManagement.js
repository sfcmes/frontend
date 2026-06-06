import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { 
  GetApp as GetAppIcon, 
  Visibility as VisibilityIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { 
  fetchComponentFiles, 
  uploadComponentFile, 
  deleteFileRevision, 
  downloadFile, 
  openFile 
} from 'src/utils/api';
import { format } from 'date-fns';

const FileManagement = ({ 
  componentId, 
  setSnackbarMessage, 
  setSnackbarOpen, 
  onComponentUpdate,
  selectedFiles,
  setSelectedFiles,
}) => {
  // State Management
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Fetch files on component mount and when componentId changes
  useEffect(() => {
    fetchFiles();
  }, [componentId]);

  // Fetch files function
  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const fetchedFiles = await fetchComponentFiles(componentId);
      setFiles(fetchedFiles);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('ไม่สามารถโหลดข้อมูลไฟล์ได้ กรุณาลองใหม่');
      setSnackbarMessage('ไม่สามารถโหลดข้อมูลไฟล์ได้ กรุณาลองใหม่');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFiles.length) {
      setSnackbarMessage('กรุณาเลือกไฟล์ที่ต้องการอัพโหลด');
      setSnackbarOpen(true);
      return;
    }

    try {
      setIsLoading(true);
      let totalProgress = 0;

      // Upload files sequentially
      for (const file of selectedFiles) {
        try {
          // Update progress
          setUploadProgress(Math.round((totalProgress / selectedFiles.length) * 100));
          
          // Upload file
          const response = await uploadComponentFile(file, componentId);
          
          // Update component if needed
          if (response.component && onComponentUpdate) {
            onComponentUpdate(response.component);
          }

          totalProgress += 1;
        } catch (err) {
          console.error(`Error uploading file ${file.name}:`, err);
          setSnackbarMessage(`ไม่สามารถอัพโหลดไฟล์ ${file.name} ได้`);
          setSnackbarOpen(true);
        }
      }

      // Refresh file list
      await fetchFiles();
      
      // Clear selected files
      setSelectedFiles([]);
      
      // Show success message
      setSnackbarMessage('อัพโหลดไฟล์สำเร็จ');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('File upload error:', err);
      setError('ไม่สามารถอัพโหลดไฟล์ได้ กรุณาลองใหม่');
      setSnackbarMessage('ไม่สามารถอัพโหลดไฟล์ได้ กรุณาลองใหม่');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Handle file actions (download/open)
  const handleFileAction = async (fileUrl, action) => {
    try {
      setIsLoading(true);
      if (action === 'download') {
        await downloadFile(fileUrl);
        setSnackbarMessage('ดาวน์โหลดไฟล์สำเร็จ');
      } else if (action === 'open') {
        await openFile(fileUrl);
        setSnackbarMessage('เปิดไฟล์สำเร็จ');
      }
      setSnackbarOpen(true);
    } catch (err) {
      console.error(`Error ${action}ing file:`, err);
      setSnackbarMessage(`ไม่สามารถ${action === 'download' ? 'ดาวน์โหลด' : 'เปิด'}ไฟล์ได้ กรุณาลองใหม่`);
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (file) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  // Handle file deletion
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      setIsLoading(true);
      await deleteFileRevision(componentId, fileToDelete.revision);
      await fetchFiles();
      setSnackbarMessage('ลบไฟล์สำเร็จ');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error deleting file:', err);
      setSnackbarMessage('ไม่สามารถลบไฟล์ได้ กรุณาลองใหม่');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  // Loading state
  if (isLoading && !files.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error && !files.length) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Upload Section */}
      {selectedFiles.length > 0 && (
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleFileUpload}
          disabled={isLoading}
          sx={{ mt: 2, mb: 2 }}
        >
          {isLoading ? 'กำลังอัพโหลด...' : 'อัพโหลดไฟล์ที่เลือก'}
        </Button>
      )}

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2">
            กำลังอัพโหลด: {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* Files Table */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ชื่อไฟล์</TableCell>
            <TableCell>Revision</TableCell>
            <TableCell>วันที่อัพโหลด</TableCell>
            <TableCell align="right">การดำเนินการ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file, index) => (
            <TableRow key={index}>
              <TableCell>{file.file_name || file.s3_url.split('/').pop()}</TableCell>
              <TableCell>{file.revision}</TableCell>
              <TableCell>
                {format(new Date(file.created_at), 'dd/MM/yyyy HH:mm:ss')}
              </TableCell>
              <TableCell align="right">
                <IconButton 
                  onClick={() => handleFileAction(file.s3_url, 'download')}
                  title="ดาวน์โหลด"
                  disabled={isLoading}
                >
                  <GetAppIcon />
                </IconButton>
                <IconButton 
                  onClick={() => handleFileAction(file.s3_url, 'open')}
                  title="เปิดดู"
                  disabled={isLoading}
                >
                  <VisibilityIcon />
                </IconButton>
                <IconButton 
                  onClick={() => handleDeleteConfirm(file)}
                  title="ลบ"
                  disabled={isLoading}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* No Files Message */}
      {files.length === 0 && (
        <Box textAlign="center" mt={2}>
          <Typography color="textSecondary">
            ไม่มีไฟล์
          </Typography>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>ยืนยันการลบไฟล์</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบไฟล์ {fileToDelete?.file_name || fileToDelete?.s3_url.split('/').pop()} ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button 
            onClick={handleDeleteFile}
            color="error"
            disabled={isLoading}
          >
            {isLoading ? 'กำลังลบ...' : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
  
};

FileManagement.propTypes = {
  componentId: PropTypes.string.isRequired,
  setSnackbarMessage: PropTypes.func.isRequired,
  setSnackbarOpen: PropTypes.func.isRequired,
  onComponentUpdate: PropTypes.func.isRequired,
  selectedFiles: PropTypes.array.isRequired,
  setSelectedFiles: PropTypes.func.isRequired,
};

export default FileManagement;