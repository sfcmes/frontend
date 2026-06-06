import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Menu, Avatar, Typography, Divider, Button, IconButton } from '@mui/material';
import { IconMail } from '@tabler/icons';
import { Stack } from '@mui/system';
import BoringAvatar from 'boring-avatars';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import { fetchUserProfile } from 'src/utils/api'; // Adjust the path if necessary

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userProfile = await fetchUserProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    loadUserProfile();
  }, []);

  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

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
                to="/auth/login"
                variant="outlined"
                color="primary"
                component={Link}
                fullWidth
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Scrollbar>
      </Menu>
    </Box>
  );
};

export default Profile;
