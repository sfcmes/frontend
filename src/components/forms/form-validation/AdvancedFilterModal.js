import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';

const AdvancedFilterModal = ({ open, onClose, columns, onFilter }) => {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (columnId, value, filterType = 'contains') => {
    setFilters(prev => ({
      ...prev,
      [columnId]: { value, filterType }
    }));
  };

  const applyFilters = () => {
    onFilter(filters);
    onClose();
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Advanced Filters</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {columns.map((column) => (
            <Grid item xs={12} sm={6} key={column.id}>
              <Typography variant="subtitle2" gutterBottom>
                {column.id}
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    size="small"
                    value={filters[column.id]?.value || ''}
                    onChange={(e) => handleFilterChange(column.id, e.target.value)}
                    placeholder={`Filter ${column.id}...`}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters[column.id]?.filterType || 'contains'}
                      onChange={(e) => handleFilterChange(column.id, filters[column.id]?.value || '', e.target.value)}
                    >
                      <MenuItem value="contains">Contains</MenuItem>
                      <MenuItem value="equals">Equals</MenuItem>
                      <MenuItem value="startsWith">Starts with</MenuItem>
                      <MenuItem value="endsWith">Ends with</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={clearFilters} color="secondary">
          Clear All
        </Button>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={applyFilters} color="primary" variant="contained">
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedFilterModal;