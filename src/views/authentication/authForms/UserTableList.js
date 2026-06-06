import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Paper,
  IconButton, Tooltip, TextField, InputAdornment, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
} from '@mui/material';
import { IconKey, IconSearch } from '@tabler/icons';
import { fetchUsers, updateUserPassword } from 'src/utils/api'; // Import API functions directly

const headCells = [
  { id: 'username', numeric: false, disablePadding: true, label: 'Username' },
  { id: 'email', numeric: false, disablePadding: false, label: 'Email' },
  { id: 'role', numeric: false, disablePadding: false, label: 'Role' },
  { id: 'actions', numeric: false, disablePadding: false, label: 'Actions' },
];

const UserTableList = ({ refreshTrigger }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('username');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [users, setUsers] = useState([]); // Initialize users as an empty array

  // Fetch users from API
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await fetchUsers();
        setUsers(response.data || []); // Ensure users is always an array
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]); // Fallback to an empty array if an error occurs
      }
    };
    fetchAllUsers();
  }, [refreshTrigger]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setSelectedUser(null);
    setNewPassword('');
  };

  const handlePasswordChange = async () => {
    setLoading(true);
    try {
      await updateUserPassword(selectedUser.id, newPassword);
      handleClosePasswordDialog();
      setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
    } catch (error) {
      console.error('Failed to change password:', error);
      setSnackbar({ open: true, message: 'Failed to change password', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Ensure users is an array before applying filter
  const filteredUsers = Array.isArray(users) 
    ? users.filter((user) =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.role.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <Box>
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          <TextField
            placeholder="Search User"
            size="small"
            onChange={handleSearch}
            value={search}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size="1.1rem" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={headCell.disablePadding ? 'none' : 'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={(event) => handleRequestSort(event, headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow hover key={row.id}>
                    <TableCell>{row.username}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>
                      <Tooltip title="Change Password">
                        <IconButton onClick={() => handleChangePassword(row)}>
                          <IconKey size="1.1rem" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>Change Password for {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="newPassword"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancel</Button>
          <Button onClick={handlePasswordChange} color="primary" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

UserTableList.propTypes = {
  refreshTrigger: PropTypes.number.isRequired,
};

export default UserTableList;
