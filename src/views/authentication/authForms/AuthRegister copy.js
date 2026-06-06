import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Divider, MenuItem, Select } from '@mui/material';
import { Link } from 'react-router-dom';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../../components/forms/theme-elements/CustomFormLabel';
import { Stack } from '@mui/system';
import { registerUser, fetchRoles } from 'src/utils/api'; // Import registerUser and fetchRoles functions from api

const AuthRegister = ({ title, subtitle, subtext }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '' });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getRoles = async () => {
      try {
        const response = await fetchRoles();
        setRoles(response.data);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    getRoles();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleRoleChange = (e) => {
    setForm({ ...form, roleId: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser({ ...form, username: form.name, status: 'active' }); // Ensure status is valid
      // Redirect to login page after successful registration
      window.location.href = '/auth/login';
    } catch (error) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h3" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}
      <Box mt={3}>
        <Divider>
          <Typography component="span" color="textSecondary" variant="h6" fontWeight="400" position="relative" px={2}>
            ลงทะเบียนผู้ใช้งาน
          </Typography>
        </Divider>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack mb={3}>
          <CustomFormLabel htmlFor="name">ชื่อผู้ใช้งาน</CustomFormLabel>
          <CustomTextField id="name" variant="outlined" fullWidth value={form.name} onChange={handleChange} />
          <CustomFormLabel htmlFor="email">Email Address</CustomFormLabel>
          <CustomTextField id="email" variant="outlined" fullWidth value={form.email} onChange={handleChange} />
          <CustomFormLabel htmlFor="password">Password</CustomFormLabel>
          <CustomTextField id="password" type="password" variant="outlined" fullWidth value={form.password} onChange={handleChange} />
          <CustomFormLabel htmlFor="roleId">Role</CustomFormLabel>
          <Select
            id="roleId"
            value={form.roleId}
            onChange={handleRoleChange}
            fullWidth
          >
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <Button color="primary" variant="contained" size="large" fullWidth type="submit">
          Sign Up
        </Button>
        {error && <Typography color="error" mt={2}>{error}</Typography>}
      </Box>
      {subtitle}
    </>
  );
};

export default AuthRegister;
