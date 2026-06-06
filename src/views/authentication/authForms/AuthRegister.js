import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Divider, MenuItem, Select, 
  Checkbox, FormControlLabel, List, ListItem, ListItemIcon, 
  ListItemText, Paper, InputAdornment, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../../components/forms/theme-elements/CustomFormLabel';
import { Stack } from '@mui/system';
import { registerUser, fetchRoles, fetchProjects } from 'src/utils/api';

const AuthRegister = ({ title, subtitle, subtext }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '', projects: [] });
  const [roles, setRoles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const getRoles = async () => {
      try {
        const response = await fetchRoles();
        setRoles(response.data);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    const getProjects = async () => {
      try {
        const response = await fetchProjects();
        setProjects(response.data);
        setFilteredProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    getRoles();
    getProjects();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleRoleChange = (e) => {
    const selectedRole = roles.find(role => role.id === e.target.value);
    setForm({ ...form, roleId: e.target.value });
    setIsAdmin(selectedRole.name === 'Admin');
  };

  const handleProjectChange = (projectId) => {
    setForm(prev => {
      const newProjects = prev.projects.includes(projectId)
        ? prev.projects.filter(id => id !== projectId)
        : [...prev.projects, projectId];
      return { ...prev, projects: newProjects };
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setForm(prev => ({ ...prev, projects: filteredProjects.map(p => p.id) }));
    } else {
      setForm(prev => ({ ...prev, projects: [] }));
    }
  };

  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchTerm(searchTerm);
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm)
    );
    setFilteredProjects(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser({ 
        ...form, 
        username: form.name, 
        status: 'active',
        projects: isAdmin ? projects.map(p => p.id) : form.projects
      });
      window.location.href = '/auth/login';
    } catch (error) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <>
      {title && <Typography fontWeight="700" variant="h3" mb={1}>{title}</Typography>}

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
          
          {!isAdmin && (
            <>
              <CustomFormLabel htmlFor="projects">Projects</CustomFormLabel>
              <Paper style={{ maxHeight: 300, overflow: 'auto', marginBottom: 10 }}>
                <CustomTextField
                  fullWidth
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={form.projects.length === filteredProjects.length}
                        indeterminate={form.projects.length > 0 && form.projects.length < filteredProjects.length}
                        onChange={handleSelectAll}
                      />
                    </ListItemIcon>
                    <ListItemText primary="Select All" />
                  </ListItem>
                  {filteredProjects.map((project) => (
                    <ListItem key={project.id} dense button onClick={() => handleProjectChange(project.id)}>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={form.projects.includes(project.id)}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText primary={project.name} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </>
          )}
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