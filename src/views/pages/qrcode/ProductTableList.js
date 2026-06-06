import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  IconButton,
  Tooltip,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Modal,
  FormControlLabel,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import { IconSearch, IconDownload, IconPrinter } from '@tabler/icons';
import { fetchComponentsByProjectId } from 'src/utils/api';

const headCells = [
  { id: 'componentName', numeric: false, disablePadding: false, label: 'Component Name' },
  { id: 'qrCode', numeric: false, disablePadding: false, label: 'QR Code' },
  { id: 'actions', numeric: false, disablePadding: false, label: 'Actions' },
];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
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
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  onRequestSort: PropTypes.func.isRequired,
};

const EnhancedTableToolbar = (props) => {
  const { handleSearch, search } = props;

  return (
    <Toolbar>
      <Box sx={{ flex: '1 1 100%' }}>
        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size="1.1rem" />
              </InputAdornment>
            ),
          }}
          placeholder="Search by Component Name, Section, or Project"
          size="small"
          onChange={handleSearch}
          value={search}
        />
      </Box>
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  handleSearch: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
};

// ProductTableList.js
const ProductTableList = ({ projectId, searchTerm }) => {
    const [rows, setRows] = useState([]);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('componentName');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [selectedQR, setSelectedQR] = useState(null);
  
    useEffect(() => {
      const fetchComponents = async () => {
        try {
          const response = await fetchComponentsByProjectId(projectId);
          console.log('Fetched components:', response.data);
          setRows(response.data);
        } catch (error) {
          console.error('Error fetching components:', error.response ? error.response.data : error);
        }
      };
  
      if (projectId) {
        fetchComponents();
      }
    }, [projectId]);
  
    return (
      <Box>
        {/* Rest of the component */}
        <TableBody>
          {stableSort(rows || [], getComparator(order, orderBy))
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => (
              <TableRow hover key={row.id} tabIndex={-1}>
                {/* Render row data */}
              </TableRow>
            ))}
        </TableBody>
      </Box>
    );
  };
  
ProductTableList.propTypes = {
  projectId: PropTypes.string.isRequired,
  searchTerm: PropTypes.string.isRequired,
};

export default ProductTableList;
