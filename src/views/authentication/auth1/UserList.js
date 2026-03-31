import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Toolbar, Typography, IconButton, Tooltip, TextField, InputAdornment, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, Chip, FormControl, InputLabel, OutlinedInput,
  Snackbar, Alert
} from '@mui/material';
import { IconTrash, IconEdit, IconSearch } from '@tabler/icons';
import { fetchUsers, fetchRoles, updateUserById, deleteUserById, assignProjectsToUser, fetchProjects, fetchUserProjects } from 'src/utils/api';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [userProjects, setUserProjects] = useState({});

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [userData, roleResponse, projectData] = await Promise.all([
        fetchUsers(),
        fetchRoles(),
        fetchProjects()
      ]);
  
      const roleMap = roleResponse.data.reduce((map, role) => {
        map[role.id] = role.name;
        return map;
      }, {});
  
      // Fetch projects for each user
      const userProjectsMap = {};
      for (const user of userData) {
        try {
          const userProjectsResponse = await fetchUserProjects(user.id);
          const projectsList = userProjectsResponse.data || [];
          userProjectsMap[user.id] = projectsList.map(p => p.project_id?.toString()).filter(Boolean);
        } catch (error) {
          console.error(`Error fetching projects for user ${user.id}:`, error);
          userProjectsMap[user.id] = [];
        }
      }
  
      setUsers(userData);
      setRoles(roleMap);
      setProjects(projectData.data);
      setUserProjects(userProjectsMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setOpenDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateUserById(editUser.id, editUser);
      setUsers(users.map(user => (user.id === editUser.id ? editUser : user)));
      setOpenDialog(false);
      setSnackbarMessage('User updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating user:", error);
      setSnackbarMessage('Failed to update user');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserById(userId);
        setUsers(users.filter((user) => user.id !== userId));
        // Also remove from userProjects state
        const updatedUserProjects = { ...userProjects };
        delete updatedUserProjects[userId];
        setUserProjects(updatedUserProjects);
        
        setSnackbarMessage('User deleted successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Error deleting user:", error);
        setSnackbarMessage('Failed to delete user');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleAssignProjects = (user) => {
    setEditUser(user);
    setSelectedProjects(userProjects[user.id] || []);
    setOpenProjectDialog(true);
  };

  const handleSaveProjects = async () => {
    setLoading(true);
    try {
      if (roles[editUser.role_id] !== 'Admin') {
        
        const result = await assignProjectsToUser(editUser.id, selectedProjects);
  
        // Update local state immediately
        const updatedUserProjects = { ...userProjects };
        updatedUserProjects[editUser.id] = selectedProjects;
        setUserProjects(updatedUserProjects);
  
        // Then refresh all data to ensure consistency
        await fetchAllData();
        
        setOpenProjectDialog(false);
        setSnackbarMessage('Projects assigned successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error assigning projects:", error);
      setSnackbarMessage('Failed to assign projects');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const renderProjectAccess = (user) => {
    try {
      if (roles[user.role_id] === 'Admin') {
        return <Chip label="All Projects" color="primary" />;
      } else if (roles[user.role_id] === 'Site User') {
        const userProjectIds = userProjects[user.id] || [];

        return userProjectIds.length > 0 ? (
          userProjectIds.map(projectId => {
            const project = projects.find(p => p.id.toString() === projectId.toString());
            return (
              <Chip 
                key={projectId} 
                label={project?.name || `Project ${projectId}`} 
                size="small" 
                style={{ margin: '2px' }} 
              />
            );
          })
        ) : (
          <Typography variant="body2" color="textSecondary">No projects assigned</Typography>
        );
      } else {
        return <Chip label="No Projects Access" color="error" />;
      }
    } catch (error) {
      console.error('Error rendering project access:', error);
      return <Typography color="error">Error displaying projects</Typography>;
    }
  };


  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {loading ? (
        <Typography>Loading users...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Toolbar>
            <TextField
              placeholder="Search Users"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch />
                  </InputAdornment>
                ),
              }}
              value={search}
              onChange={handleSearch}
              size="small"
            />
          </Toolbar>

          {filteredUsers.length === 0 ? (
            <Typography>No users found</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Projects Access</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{roles[user.role_id]}</TableCell>
                        <TableCell>{renderProjectAccess(user)}</TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleEdit(user)}>
                              <IconEdit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => handleDelete(user.id)}>
                              <IconTrash />
                            </IconButton>
                          </Tooltip>
                          {roles[user.role_id] !== 'Admin' && (
                            <Tooltip title="Assign Projects">
                              <Button onClick={() => handleAssignProjects(user)}>
                                Assign Projects
                              </Button>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </TableContainer>
          )}

          {/* Edit User Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Edit User: {editUser?.username}</DialogTitle>
            <DialogContent>
              <TextField
                label="Username"
                value={editUser?.username || ''}
                onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Email"
                value={editUser?.email || ''}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={editUser?.role_id || ''}
                  onChange={(e) => setEditUser({ ...editUser, role_id: e.target.value })}
                  label="Role"
                >
                  {Object.entries(roles).map(([id, name]) => (
                    <MenuItem key={id} value={id}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} color="primary">Save</Button>
            </DialogActions>
          </Dialog>

          {/* Assign Projects Dialog */}
          <Dialog open={openProjectDialog} onClose={() => setOpenProjectDialog(false)}>
            <DialogTitle>
              {roles[editUser?.role_id] === 'Admin' 
                ? 'Admin has access to all projects' 
                : `Assign Projects for: ${editUser?.username}`}
            </DialogTitle>
            <DialogContent>
              {roles[editUser?.role_id] !== 'Admin' && (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="project-multiple-chip-label">Projects</InputLabel>
                  <Select
                    labelId="project-multiple-chip-label"
                    multiple
                    value={selectedProjects}
                    onChange={(e) => setSelectedProjects(e.target.value)}
                    input={<OutlinedInput id="select-multiple-chip" label="Projects" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const project = projects.find(p => p.id === value);
                          return (
                            <Chip key={value} label={project?.name || value} />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {roles[editUser?.role_id] === 'Admin' && (
                <Typography>Admins have access to all projects by default.</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenProjectDialog(false)}>Cancel</Button>
              {roles[editUser?.role_id] !== 'Admin' && (
                <Button onClick={handleSaveProjects} color="primary">Save</Button>
              )}
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSnackbarOpen(false)} 
              severity={snackbarSeverity} 
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
};

export default UserList;