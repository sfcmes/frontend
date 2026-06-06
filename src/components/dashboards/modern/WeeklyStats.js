import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Dialog,
  Snackbar,
  Alert,
  Paper,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  ChevronLeft,
  ChevronRight,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { publicApi, api, deleteProjectImage } from 'src/utils/api';

const COMPONENT_HEIGHT = 600;
const IMAGE_HEIGHT = 400;

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.9),
  display: 'flex',
  flexDirection: 'column',
  height: COMPONENT_HEIGHT,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: IMAGE_HEIGHT,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  overflow: 'hidden',
}));

const StyledImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  cursor: 'pointer',
});

const NavigationButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: alpha(theme.palette.primary.main, 0.7),
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.dark, 0.9),
  },
  '&.Mui-disabled': {
    backgroundColor: alpha(theme.palette.action.disabled, 0.7),
    color: theme.palette.action.disabled,
  },
}));

const ImageCounter = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  bottom: '10px',
  right: '10px',
  padding: '4px 8px',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: theme.palette.common.white,
  borderRadius: '4px',
  fontSize: '0.875rem',
}));

const UploadButton = styled(Button)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.7),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.dark, 0.9),
  },
}));

const WeeklyStats = ({ projectId, projectName, userRole, currentTab }) => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const fileInputRef = useRef(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const canUpload = userRole === 'Admin' || userRole === 'Site User';

  const fetchImages = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await publicApi.get(`/projects/${projectId}/images`);
      setImages(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching project images:', error);
      setError('Failed to load images. Please try again later.');
      setImages([]);
    }
  }, [projectId]);

  useEffect(() => {
    setImages([]);
    setCurrentIndex(0);
    setError(null);
    if (projectId) {
      fetchImages();
    }
  }, [projectId, fetchImages, currentTab]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  }, [images.length]);

  const handleImageClick = useCallback(() => {
    setOpen(true);
    setIsZoomed(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleZoomToggle = useCallback(() => {
    setIsZoomed((prev) => !prev);
  }, []);

  const handleUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/projects/${projectId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prevImages) => [...prevImages, response.data]);
      setSnackbarMessage('Image uploaded successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (uploadError) {
      setError('Failed to upload image. Please try again.');
      setSnackbarMessage('Failed to upload image');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error('Error uploading image:', uploadError);
    } finally {
      setUploading(false);
    }
  }, [projectId]);

  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  const handleMenuOpen = (event, imageId) => {
    setAnchorEl(event.currentTarget);
    setSelectedImageId(imageId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedImageId(null);
  };

  const handleDeleteImage = async () => {
    if (!selectedImageId) return;

    try {
      await deleteProjectImage(projectId, selectedImageId);
      setImages(images.filter(img => img.id !== selectedImageId));
      setSnackbarMessage('Image deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      if (currentIndex >= images.length - 1) {
        setCurrentIndex(Math.max(0, images.length - 2));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setSnackbarMessage('Failed to delete image');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      handleMenuClose();
    }
  };

  return (
    <StyledPaper elevation={3} sx={{ height: isSmallScreen ? 'auto' : COMPONENT_HEIGHT }}>
      <Typography variant="h6" sx={{ 
        fontWeight: 'bold', 
        p: isSmallScreen ? 1 : 2, 
        textAlign: 'center',
        fontSize: isSmallScreen ? '1rem' : '1.25rem'
      }}>
        {projectName || 'No Project Selected'}
      </Typography>

      <ImageContainer sx={{ height: isSmallScreen ? 250 : IMAGE_HEIGHT }}>
        {projectId ? (
          images.length > 0 ? (
            <>
              <StyledImage
                src={images[currentIndex]?.image_url}
                alt={`Project ${currentIndex + 1}`}
                onClick={handleImageClick}
              />
              <NavigationButton 
                onClick={handlePrevious} 
                sx={{ left: 10 }}
                disabled={images.length <= 1}
              >
                <ChevronLeft />
              </NavigationButton>
              <NavigationButton 
                onClick={handleNext} 
                sx={{ right: 10 }}
                disabled={images.length <= 1}
              >
                <ChevronRight />
              </NavigationButton>
              <ImageCounter>
                {currentIndex + 1} / {images.length}
              </ImageCounter>
              {canUpload && (
                <IconButton
                  onClick={(e) => handleMenuOpen(e, images[currentIndex].id)}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              )}
            </>
          ) : (
            <Typography align="center" color="text.secondary">
              No images available for this project.
            </Typography>
          )
        ) : (
          <Typography align="center" color="text.secondary">
            Please select a project to view images.
          </Typography>
        )}
      </ImageContainer>

      {canUpload && projectId && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <UploadButton
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            size="small"
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload Image'}
          </UploadButton>
        </Box>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: 'black',
            boxShadow: 'none',
          },
        }}
      >
        <IconButton
          onClick={handleClose}
          aria-label="close"
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            zIndex: 2,
          }}
        >
          <CloseIcon />
        </IconButton>
        {images.length > 0 && (
          <Box 
            sx={{ 
              width: '100%', 
              height: '80vh', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
          >
            <img
              src={images[currentIndex].image_url}
              alt={`Full-size Project ${currentIndex + 1}`}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain',
                transition: 'transform 0.3s ease-in-out',
                transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
              }}
            />
          </Box>
        )}
        <IconButton
          onClick={handleZoomToggle}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
          }}
        >
          {isZoomed ? <ZoomOutIcon /> : <ZoomInIcon />}
        </IconButton>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteImage}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Image
        </MenuItem>
      </Menu>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </StyledPaper>
  );
};

export default WeeklyStats;