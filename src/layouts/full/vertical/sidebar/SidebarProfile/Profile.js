import React, { useState, useEffect, useContext } from 'react';
import { Box, Avatar, Typography, IconButton, Tooltip, useMediaQuery, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import img1 from 'src/assets/images/profile/user-1.jpg';
import { IconPower } from '@tabler/icons';
import { useNavigate } from "react-router-dom";
import { fetchUserProfile } from 'src/utils/api';
import { AuthContext } from 'src/contexts/AuthContext';

export const Profile = () => {
  const customizer = useSelector((state) => state.customizer);
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
  const navigate = useNavigate();

  const { user, logout } = useContext(AuthContext);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await fetchUserProfile();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (err.message === 'User is not authenticated') {
          navigate('/auth/login');
        } else {
          setError(err.message || 'An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      getUserData();
    } else {
      setLoading(false);
    }
  }, [navigate, user]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
          <Typography color="error" variant="body2" gutterBottom>Error: {error}</Typography>
          <Typography variant="caption">Please try logging in again or contact support if the issue persists.</Typography>
        </Box>
      );
    }

    return (
      <>
        <Avatar alt={userData?.name || 'User'} src={userData?.avatar || img1} />
        <Box>
          <Typography variant="h6" color="textPrimary">{userData?.name || 'User'}</Typography>
          <Typography variant="caption" color="textSecondary">{userData?.role || 'Role not available'}</Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Logout" placement="top">
            <IconButton color="primary" onClick={handleLogout} aria-label="logout" size="small">
              <IconPower size="20" />
            </IconButton>
          </Tooltip>
        </Box>
      </>
    );
  };

  return (
    <Box
      display={'flex'}
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: 'secondary.light' }}
    >
      {!hideMenu ? renderContent() : ''}
    </Box>
  );
};
