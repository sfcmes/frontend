import React from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Box, Typography
} from '@mui/material';

const TowersModal = ({ open, handleClose, data, handleSave }) => {
  const [formData, setFormData] = React.useState(data || {});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{data ? 'Edit Tower' : 'Add Tower'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">{data ? data.name : 'New Tower'}</Typography>
          <TextField
            margin="dense"
            name="code"
            label="Tower Code"
            type="text"
            fullWidth
            variant="standard"
            value={formData.code || ''}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="name"
            label="Tower Name"
            type="text"
            fullWidth
            variant="standard"
            value={formData.name || ''}
            onChange={handleChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={() => handleSave(formData)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TowersModal;
