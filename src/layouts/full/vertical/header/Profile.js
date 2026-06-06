import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Menu, 
  Avatar, 
  Typography, 
  Divider, 
  Button, 
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { IconMail } from '@tabler/icons';
import { Stack } from '@mui/system';
import BoringAvatar from 'boring-avatars';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import { fetchUserProfile } from 'src/utils/api';
import { useAuth } from 'src/contexts/AuthContext'; // Import useAuth hook

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth(); // Use the logout function from AuthContext

  useEffect(() => {
    const loadUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // If no token, don't try to fetch profile
        console.log('No auth token found');
        return;
      }
      
      try {
        const userProfile = await fetchUserProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Only redirect if it's truly an auth error
        if (error.response && error.response.status === 401) {
          navigate('/auth/login');
        }
      }
    };
    loadUserProfile();
  }, [navigate]);

  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
  };

  const handleLogoutCancel = () => {
    setOpenLogoutDialog(false);
  };

  const handleLogoutConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await logout(); // Use the logout function from AuthContext
      handleClose2();
      setOpenLogoutDialog(false);
      navigate('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
 // For public view, render a login button instead of profile
  if (!localStorage.getItem('token')) {
    return (
      <Box>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/auth/login')}
        >
          Login
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        {user ? (
          <Avatar sx={{ width: 35, height: 35 }}>
            <BoringAvatar
              size={35}
              name={user.username}
              variant="beam"
              colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
            />
          </Avatar>
        ) : (
          <Avatar sx={{ width: 35, height: 35 }}>U</Avatar>
        )}
      </IconButton>
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '360px',
          },
        }}
      >
        <Scrollbar sx={{ height: '100%', maxHeight: '85vh' }}>
          <Box p={3}>
            <Typography variant="h5">USER</Typography>
            <Stack direction="row" py={3} spacing={2} alignItems="center">
              {user ? (
                <Avatar sx={{ width: 95, height: 95 }}>
                  <BoringAvatar
                    size={95}
                    name={user.username}
                    variant="beam"
                    colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                  />
                </Avatar>
              ) : (
                <Avatar sx={{ width: 95, height: 95 }}>U</Avatar>
              )}
              <Box>
                {user ? (
                  <>
                    <Typography variant="subtitle2" color="textPrimary" fontWeight={600}>
                      {user.username}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      {user.role}
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <IconMail width={15} height={15} />
                      {user.email}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle2" color="textPrimary" fontWeight={600}>
                      Loading...
                    </Typography>
                  </>
                )}
              </Box>
            </Stack>
            <Divider />
            <Box mt={2}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleLogoutClick}
                disabled={isLoading}
              >
                {isLoading ? 'Logging out...' : 'Logout'}
              </Button>
            </Box>
            {error && (
              <Typography color="error" mt={2}>
                {error}
              </Typography>
            )}
          </Box>
        </Scrollbar>
      </Menu>
      <Dialog
        open={openLogoutDialog}
        onClose={handleLogoutCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Logout"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to log out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} color="primary" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;