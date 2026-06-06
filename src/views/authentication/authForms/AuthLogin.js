import React from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
} from '@mui/material';
import { Link } from 'react-router-dom';

import CustomCheckbox from '../../../components/forms/theme-elements/CustomCheckbox';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../../components/forms/theme-elements/CustomFormLabel';

const AuthLogin = ({ title, subtext }) => (
  <>
    {title ? (
      <Typography fontWeight="700" variant="h3" mb={1} color="common.white">
        {title}
      </Typography>
    ) : null}

    {subtext}

    <Stack spacing={2}>
      <Box>
        <CustomFormLabel htmlFor="username" sx={{ color: 'common.white' }}>Username</CustomFormLabel>
        <CustomTextField 
          id="username" 
          variant="outlined" 
          fullWidth 
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
          type="password" 
          variant="outlined" 
          fullWidth 
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
      <Stack justifyContent="space-between" direction="row" alignItems="center">
        <FormGroup>
          <FormControlLabel
            control={<CustomCheckbox defaultChecked />}
            label="Remember this Device"
            sx={{ color: 'common.white' }}
          />
        </FormGroup>
        <Typography
          component={Link}
          to="/auth/forgot-password"
          fontWeight="500"
          sx={{
            textDecoration: 'none',
            color: 'common.white',
          }}
        >
          Forgot Password ?
        </Typography>
      </Stack>
    </Stack>
    <Box mt={3}>
      <Button
        color="primary"
        variant="contained"
        size="large"
        fullWidth
        component={Link}
        to="/"
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
  </>
);

export default AuthLogin;