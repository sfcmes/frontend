import React, { useState, useMemo, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Box, TablePagination, TableSortLabel,
  Menu, MenuItem, IconButton, Tooltip, Checkbox
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import EditDialog from './EditDialog';
import AdvancedFilterModal from './AdvancedFilterModal';

const DataTable = ({ data }) => {
  const [columns, setColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRow, setEditingRow] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [visibleColumns, setVisibleColumns] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    if (data.length > 0) {
      const cols = Object.keys(data[0]).map(key => ({
        id: key,
        label: key,
        minWidth: 100
      }));
      setColumns(cols);
      setVisibleColumns(cols.reduce((acc, col) => ({ ...acc, [col.id]: true }), {}));
      setOrderBy(cols[0].id);
    }
  }, [data]);

  const handleRequestSort = (property) => {
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

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSave = (updatedRow) => {
    console.log('Updated row:', updatedRow);
    setEditingRow(null);
  };

  const sortedData = useMemo(() => {
    if (!orderBy) return data;
    return [...data].sort((a, b) => {
      if (b[orderBy] < a[orderBy]) {
        return order === 'asc' ? 1 : -1;
      }
      if (b[orderBy] > a[orderBy]) {
        return order === 'asc' ? -1 : 1;
      }
      return 0;
    });
  }, [data, order, orderBy]);

  const filteredData = useMemo(() => {
    return sortedData.filter(row =>
      Object.values(row).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          placeholder="Search..."
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Box>
          <Tooltip title="Advanced Filter">
            <IconButton onClick={() => setFilterModalOpen(true)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Customize Columns">
            <IconButton onClick={handleMenuOpen}>
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actions">
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.filter(col => visibleColumns[col.id]).map((column) => (
                <TableCell
                  key={column.id}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow hover key={index}>
                  {columns.filter(col => visibleColumns[col.id]).map((column) => (
                    <TableCell key={column.id}>{row[column.id]}</TableCell>
                  ))}
                  <TableCell>
                    <Button size="small" onClick={() => setEditingRow(row)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {columns.map((column) => (
          <MenuItem key={column.id}>
            <Checkbox
              checked={visibleColumns[column.id]}
              onChange={(e) => setVisibleColumns({ ...visibleColumns, [column.id]: e.target.checked })}
            />
            {column.label}
          </MenuItem>
        ))}
      </Menu>

      {editingRow && (
        <EditDialog
          open={Boolean(editingRow)}
          onClose={() => setEditingRow(null)}
          row={editingRow}
          onSave={handleSave}
        />
      )}

      <AdvancedFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        columns={columns}
        onFilter={() => {}} // Implement this function as needed
      />
    </Box>
  );
};

export default DataTable;