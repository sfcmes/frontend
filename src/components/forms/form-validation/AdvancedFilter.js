import React, { useState } from 'react';
import { 
  Box, TextField, Select, MenuItem, Button, FormControl, InputLabel, Grid
} from '@mui/material';

const AdvancedFilter = ({ columns, onFilter }) => {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({ ...prev, [column.id]: value }));
  };

  const applyFilters = () => {
    onFilter(filters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilter({});
  };

  return (
    <Box my={2}>
      <Grid container spacing={2}>
        {columns.map(column => (
          <Grid item xs={12} sm={6} md={4} key={column.id}>
            <FormControl fullWidth>
              <TextField
                label={column.id}
                value={filters[column.id] || ''}
                onChange={(e) => handleFilterChange(column, e.target.value)}
                variant="outlined"
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={applyFilters} sx={{ mr: 1 }}>
          Apply Filters
        </Button>
        <Button variant="outlined" onClick={clearFilters}>
          Clear Filters
        </Button>
      </Box>
    </Box>
  );
};

export default AdvancedFilter;