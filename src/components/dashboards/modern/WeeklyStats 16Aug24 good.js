import React, { useState } from 'react';
import { Grid, useTheme, useMediaQuery, Dialog, Box } from '@mui/material';
import ProductCarousel from 'src/components/apps/ecommerce/ProductDetail/ProductCarousel';
import ChildCard from 'src/components/shared/ChildCard';

const WeeklyStats = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // Function to handle image click
  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
    setOpen(true);
  };

  // Function to close the dialog
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Grid 
      container 
      spacing={3} 
      sx={{ 
        maxWidth: { lg: '1055px', xl: '1200px' }, 
        margin: '0 auto', 
        padding: { xs: 2, sm: 3, md: 4 } 
      }}
    >
      <Grid item xs={12}>
        <ChildCard>
          <Grid 
            container 
            spacing={3} 
            justifyContent="center"
            sx={{ 
              height: isSmallScreen ? '300px' : '500px', 
              overflow: 'hidden',
            }}
          >
            <Grid item xs={12} sx={{ height: '100%' }}>
              <ProductCarousel onImageClick={handleImageClick} />
            </Grid>
          </Grid>
        </ChildCard>
      </Grid>
      
      {/* Dialog for image enlargement */}
      <Dialog open={open} onClose={handleClose} maxWidth="md">
        <Box sx={{ padding: 2 }}>
          <img src={selectedImage} alt="Enlarged" style={{ width: '100%', height: 'auto' }} />
        </Box>
      </Dialog>
    </Grid>
  );
};

export default WeeklyStats;
