import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import Logo from 'src/layouts/full/shared/logo/Logo';
import AuthLogin from './AuthLogin'
import videoBg from 'src/assets/videos/video.mov';

const Login = () => (
  <PageContainer title="Login" description="this is Login page">
    <Grid container sx={{ height: '100vh', position: 'relative' }}>
      <Box
        component="video"
        src={videoBg}
        autoPlay
        muted
        loop
        playsInline
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: -1,
        }}
      />
      <Grid
        item
        xs={12}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100vh',
        }}
      >
        <Box p={3}>
          <Logo />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            pb: 5,
          }}
        >
          <Box
            sx={{
              maxWidth: '400px',
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)', // Increased transparency
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              p: 4,
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <AuthLogin
              title="WELCOME TO SFC PC SYSTEM"
              subtext={
                <Typography variant="subtitle1" color="textSecondary" mb={1}>
                  SFC PRECAST SYSTEM
                </Typography>
              }
            />
          </Box>
        </Box>
      </Grid>
    </Grid>
  </PageContainer>
);

export default Login;
