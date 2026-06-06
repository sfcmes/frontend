import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { useAuth } from '../../../contexts/AuthContext';
import logo from 'src/assets/images/logos/logo-main.svg';

const AuthLogin = ({ title, subtext, isSmallScreen, onLoginSuccess, selectedComponentId }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailOrUsername.trim() || !password.trim()) {
      setError('Both fields are required');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(emailOrUsername, password);
      if (result.success) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        if (selectedComponentId) {
          window.location.href = `https://sfcpcsystem.ngrok.io/forms/form-component-card/${selectedComponentId}`;
        }
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={isSmallScreen ? 1 : 2} alignItems="center">
        <Box sx={{ width: isSmallScreen ? '80px' : '120px', mb: isSmallScreen ? 0 : 1 }}>
          <img src={logo} alt="Logo" style={{ width: '100%', height: 'auto' }} />
        </Box>

        {title && (
          <Typography
            fontWeight="700"
            variant={isSmallScreen ? "h5" : "h3"}
            sx={{
              color: 'common.white',
              textAlign: 'center',
              letterSpacing: '0.05em',
              lineHeight: 1.2,
              textShadow: '1px 1px 4px rgba(0, 0, 0, 0.6)',
              mb: isSmallScreen ? 0.5 : 1,
            }}
          >
            {title}
          </Typography>
        )}

        {!isSmallScreen && subtext}

        <CustomTextField
          placeholder="Email or Username"
          fullWidth
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: isSmallScreen ? '40px' : '50px',
              fontSize: isSmallScreen ? '0.9rem' : '1rem',
            },
          }}
        />

        <CustomTextField
          type="password"
          placeholder="Password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: isSmallScreen ? '40px' : '50px',
              fontSize: isSmallScreen ? '0.9rem' : '1rem',
            },
          }}
        />

        {error && (
          <Typography color="error" fontSize={isSmallScreen ? '0.7rem' : '0.9rem'} textAlign="center">
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          fullWidth
          type="submit"
          disabled={isLoading}
          sx={{
            mt: isSmallScreen ? 1 : 2,
            height: isSmallScreen ? '36px' : '50px',
            fontSize: isSmallScreen ? '0.9rem' : '1rem',
            textTransform: 'none',
          }}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </Stack>
    </form>
  );
};

export default AuthLogin;