import React from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Box, Typography
} from '@mui/material';

const UnitsModal = ({ open, handleClose, data, handleSave }) => {
  const [formData, setFormData] = React.useState(data || {});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{data ? 'Edit Unit' : 'Add Unit'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">{data ? `Unit ${data.unitNumber}` : 'New Unit'}</Typography>
          <TextField
            margin="dense"
            name="unitNumber"
            label="Unit Number"
            type="number"
            fullWidth
            variant="standard"
            value={formData.unitNumber || ''}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="status"
            label="Status"
            type="text"
            fullWidth
            variant="standard"
            value={formData.status || ''}
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

export default UnitsModal;
