import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Stack } from '@mui/material';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../../components/forms/theme-elements/CustomFormLabel';
import { useAuth } from '../../../contexts/AuthContext';

const AuthLogin = ({ title, subtext }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/dashboards/modern');
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {title && (
        <Typography fontWeight="700" variant="h3" mb={1} color="common.white">
          {title}
        </Typography>
      )}

      {subtext}

      <Stack spacing={2}>
        <Box>
          <CustomFormLabel htmlFor="username" sx={{ color: 'common.white' }}>Username</CustomFormLabel>
          <CustomTextField
            id="username"
            name="username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.7)' },
                '&.Mui-focused fieldset': { borderColor: 'white' },
              },
              input: { color: 'common.white' }
            }}
          />
        </Box>
        <Box>
          <CustomFormLabel htmlFor="password" sx={{ color: 'common.white' }}>Password</CustomFormLabel>
          <CustomTextField
            id="password"
            name="password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.7)' },
                '&.Mui-focused fieldset': { borderColor: 'white' },
              },
              input: { color: 'common.white' }
            }}
          />
        </Box>
      </Stack>
      {error && <Typography color="error" mt={2}>{error}</Typography>}
      <Box mt={3}>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'common.white',
            }
          }}
        >
          Sign In
        </Button>
      </Box>
    </form>
  );
};

export default AuthLogin;
