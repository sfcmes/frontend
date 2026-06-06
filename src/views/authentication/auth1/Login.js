import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import { Grid, Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useSpring, animated, config } from 'react-spring';
import PageContainer from 'src/components/container/PageContainer';
import Logo from 'src/layouts/full/shared/logo/Logo';
import AuthLogin from './AuthLogin';
// import videoBg from 'src/assets/videos/video.mov';
import videoBg from 'src/assets/videos/Gen-3_image-prompt_landing.mp4';

const AnimatedBox = animated(Box);

const Login = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/dashboards/modern', { replace: true });
    }
  }, [user, navigate]);

  const logoAnimation = useSpring({
    from: { opacity: 0, transform: 'translateY(-50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: config.molasses,
  });

  const formAnimation = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.gentle,
    delay: 300,
  });

  const handleLogoClick = () => {
    navigate('/dashboards/modern');
  };

  const getFormWidth = () => {
    if (isXs) return '95%';
    if (isSm) return '70%';
    if (isMd) return '60%';
    return '400px';
  };

  return (
    <PageContainer title="Login" description="this is Login page">
      <Box sx={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Box
          component="video"
          src={videoBg}
          autoPlay
          muted
          loop
          playsInline
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            objectPosition: 'center center',
            zIndex: -1,
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            zIndex: 0,
          }}
        />
        <Grid container sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
          <Grid
            item
            xs={12}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <AnimatedBox 
              p={isXs ? 1 : isSm ? 2 : 3} 
              style={logoAnimation} 
              onClick={handleLogoClick}
              sx={{ cursor: 'pointer' }}
            >
              <Logo />
            </AnimatedBox>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1,
                pb: isXs ? 1 : isSm ? 2 : 3,
              }}
            >
              <AnimatedBox
                style={formAnimation}
                sx={{
                  width: getFormWidth(),
                  maxWidth: '400px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  p: isXs ? 2 : isSm ? 3 : 4,
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <AuthLogin
                  title="WELCOME TO SFC PC SYSTEM"
                  subtext={
                    <Typography 
                      variant={isXs ? "caption" : isSm ? "body2" : "body1"} 
                      color="textSecondary" 
                      mb={1}
                    >
                      SFC PRECAST SYSTEM
                    </Typography>
                  }
                  isSmallScreen={isXs}
                />
              </AnimatedBox>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Login;