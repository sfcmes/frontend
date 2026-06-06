import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%', // Responsive width
  maxWidth: '500px', // Max width for larger screens
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
};

const EditSectionModal = ({ open, section, onClose, onSave, isEditing }) => {
  const [formData, setFormData] = useState({
    projectSelection: '',
    sectionName: '',
    status: '',
  });

  useEffect(() => {
    if (section) {
      setFormData({
        projectSelection: section.project_id || '',
        sectionName: section.name || '',
        status: section.status || '',
      });
    }
  }, [section]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const updatedSection = {
      id: section.id,
      project_id: formData.projectSelection,
      name: formData.sectionName,
      status: formData.status,
      updated_at: new Date(),
    };
    await onSave(updatedSection);
    onClose(); // Close the modal after saving
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" mb={2}>
          {isEditing ? 'Edit Section' : 'View Section'}
        </Typography>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="projectSelection-label">Project</InputLabel>
            <Select
              labelId="projectSelection-label"
              id="projectSelection"
              name="projectSelection"
              value={formData.projectSelection}
              onChange={handleChange}
              fullWidth
              disabled={!isEditing}
            >
              {/* Dynamically generate project options here */}
              <MenuItem value={section?.project_id || ''}>
                {section?.project_name || 'Select a project'}
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            id="sectionName"
            name="sectionName"
            label="Section Name"
            value={formData.sectionName}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              fullWidth
              disabled={!isEditing}
            >
              <MenuItem value="planning">Planning</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {isEditing && (
              <Button variant="contained" color="primary" onClick={handleSave}>
                Save
              </Button>
            )}
            <Button variant="outlined" sx={{ color: 'gray', borderColor: 'gray' }} onClick={onClose}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
};

export default EditSectionModal;
