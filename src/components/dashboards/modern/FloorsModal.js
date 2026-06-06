import React from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Box, Typography
} from '@mui/material';

const FloorsModal = ({ open, handleClose, data, handleSave }) => {
  const [formData, setFormData] = React.useState(data || {});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{data ? 'Edit Floor' : 'Add Floor'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">{data ? `Floor ${data.floorNumber}` : 'New Floor'}</Typography>
          <TextField
            margin="dense"
            name="floorNumber"
            label="Floor Number"
            type="number"
            fullWidth
            variant="standard"
            value={formData.floorNumber || ''}
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

export default FloorsModal;
