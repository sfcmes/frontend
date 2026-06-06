import React, { useEffect, useRef, useState } from 'react';
import { Box, Dialog, IconButton } from '@mui/material';
import { IconZoomIn, IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { fetchProducts } from '../../../../store/apps/eCommerce/EcommerceSlice';
import SliderData from './SliderData';

const ProductCarousel = () => {
  const [nav1, setNav1] = useState(null);
  const [nav2, setNav2] = useState(null);
  const [open, setOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slider1 = useRef(null);
  const slider2 = useRef(null);
  const fullScreenSlider = useRef(null);
  const dispatch = useDispatch();
  const { id } = useParams();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const product = useSelector((state) => state.ecommerceReducer.products[id - 1]);
  const getProductImage = product ? product.photo : '';

  useEffect(() => {
    setNav1(slider1.current);
    setNav2(slider2.current);
  }, []);

  const allImages = [getProductImage, ...SliderData.map(item => item.imgPath)];

  const settingsMain = {
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    fade: true,
    asNavFor: nav2,
    beforeChange: (current, next) => setCurrentSlide(next),
  };

  const settingsThumbs = {
    slidesToShow: 5,
    slidesToScroll: 1,
    asNavFor: nav1,
    dots: false,
    centerMode: true,
    swipeToSlide: true,
    focusOnSelect: true,
    centerPadding: '10px',
  };

  const settingsFullScreen = {
    ...settingsMain,
    arrows: true,
    fade: false,
    adaptiveHeight: true,
  };

  const handleImageClick = (index) => {
    setCurrentSlide(index);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handlePrev = () => {
    fullScreenSlider.current.slickPrev();
  };

  const handleNext = () => {
    fullScreenSlider.current.slickNext();
  };

  const renderImageWithButton = (imageSrc, index) => (
    <Box sx={{ position: 'relative', '&:hover .zoom-button': { opacity: 1 } }}>
      <img
        src={imageSrc}
        alt={`Product ${index + 1}`}
        style={{ width: '100%', height: 'auto', borderRadius: '8px', transition: 'opacity 0.3s' }}
      />
      <IconButton
        onClick={() => handleImageClick(index)}
        className="zoom-button"
        sx={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          opacity: 0,
          transition: 'opacity 0.3s',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        }}
      >
        <IconZoomIn size={20} />
      </IconButton>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: '768px', margin: '0 auto' }}>
      <Slider {...settingsMain} ref={slider1} sx={{ marginBottom: 2 }}>
        {allImages.map((imageSrc, index) => (
          <Box key={index}>{renderImageWithButton(imageSrc, index)}</Box>
        ))}
      </Slider>

      <Slider {...settingsThumbs} ref={slider2}>
        {allImages.map((imageSrc, index) => (
          <Box key={index} sx={{ padding: '0 4px' }}>
            <img
              src={imageSrc}
              alt={`Thumbnail ${index + 1}`}
              style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
            />
          </Box>
        ))}
      </Slider>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ position: 'relative', bgcolor: 'black' }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 1,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            }}
          >
            <IconX size={20} />
          </IconButton>
          <Slider {...settingsFullScreen} ref={fullScreenSlider} initialSlide={currentSlide}>
            {allImages.map((imageSrc, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <img
                  src={imageSrc}
                  alt={`Full-screen ${index + 1}`}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </Box>
            ))}
          </Slider>
          <IconButton
            onClick={handlePrev}
            sx={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            }}
          >
            <IconChevronLeft size={24} />
          </IconButton>
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            }}
          >
            <IconChevronRight size={24} />
          </IconButton>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ProductCarousel;