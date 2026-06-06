import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Link,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchComponentById, updateComponentStatus } from 'src/utils/api';

const ComponentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    loadComponentDetails();
  }, [id]);

  const loadComponentDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchComponentById(id);
      setComponent(data);
      setNewStatus(data.status); // Set current status as default
    } catch (err) {
      setError('Failed to load component details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    setOpenConfirmDialog(true);
  };
  
  const handleConfirmStatusUpdate = async () => {
    setOpenConfirmDialog(false);
    try {
      await updateComponentStatus(id, newStatus);
      await loadComponentDetails(); // Reload component details
      setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
    } catch (err) {
      setError('Failed to update status. Please try again.');
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
      console.error(err);
    }
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setNewStatus(component.status); // Reset to current status
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusOptions = () => {
    return ['Planning', 'In Progress', 'Completed', 'อยู่ระหว่างขนส่ง', 'ส่งชิ้นงานแล้ว', 'ขนส่งแล้ว', 'Accept', 'Reject', 'ติดตั้งแล้ว'];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button variant="contained" onClick={loadComponentDetails}>Retry</Button>
      </Box>
    );
  }

  if (!component) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography gutterBottom>No component found</Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Component Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography><strong>Name:</strong> {component.name}</Typography>
            <Typography><strong>Type:</strong> {component.type}</Typography>
            <Typography><strong>Width:</strong> {component.width} mm</Typography>
            <Typography><strong>Height:</strong> {component.height} mm</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography><strong>Project:</strong> {component.project?.name || 'N/A'}</Typography>
            <Typography><strong>Section:</strong> {component.section?.name || 'N/A'}</Typography>
            <Typography>
              <strong>Current Status:</strong> 
              <Chip 
                label={component.status} 
                color={component.status === 'Completed' ? 'success' : 'default'} 
                size="small" 
                sx={{ ml: 1 }}
              />
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>Update Status</Typography>
          <Select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>
              Select new status
            </MenuItem>
            {getStatusOptions().map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            onClick={handleStatusUpdate}
            disabled={!newStatus || newStatus === component.status}
            sx={{ mt: 1 }}
          >
            Update Status
          </Button>
        </Box>

        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
          Files:
        </Typography>
        <List>
          {component.files && component.files.length > 0 ? (
            component.files.map((file, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={
                    <Link href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.name}
                    </Link>
                  }
                  secondary={`Type: ${file.type || 'Unknown'}`}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No files available" />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{'Confirm Status Update'}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to update the status to {newStatus}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleConfirmStatusUpdate} autoFocus>
            Confirm Update
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ComponentDetailsPage;