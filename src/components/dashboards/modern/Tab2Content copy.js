import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Collapse,
  IconButton,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Chart from 'react-apexcharts';
import { fetchProjectsWithOtherComponents, updateOtherComponentStatus } from 'src/utils/api';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    fontSize: '0.8rem',
  },
}));

const COLORS = {
  manufactured: '#82ca9d',
  transported: '#ffc658',
  rejected: '#ff6b6b'
};

const STATUS_THAI = {
  manufactured: 'ผลิตแล้ว',
  transported: 'ขนส่งสำเร็จ',
  rejected: 'ถูกปฏิเสธ',
};

const DoughnutChart = ({ data, status }) => {
  const theme = useTheme();
  
  const options = {
    chart: {
      type: 'donut',
    },
    labels: [STATUS_THAI[status], 'อื่นๆ'],
    colors: [COLORS[status], theme.palette.grey[300]],
    legend: {
      show: true,
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    }
  };

  const series = [data[status], data.total - data[status]];

  return (
    <Chart options={options} series={series} type="donut" width="100%" height={200} />
  );
};

const ComponentRow = memo(({ component, onUpdateStatus }) => {
  const [open, setOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    fromStatus: '',
    toStatus: '',
    quantity: 0
  });

  const handleStatusUpdate = useCallback((e) => {
    e.preventDefault();
    const { fromStatus, toStatus, quantity } = statusUpdate;
    
    if (quantity <= 0 || quantity > component[fromStatus]) {
      alert('จำนวนไม่ถูกต้อง');
      return;
    }

    onUpdateStatus(component.id, fromStatus, toStatus, quantity);
    setStatusUpdate({ fromStatus: '', toStatus: '', quantity: 0 });
  }, [statusUpdate, component, onUpdateStatus]);

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{component.name}</TableCell>
        <TableCell align="right">{component.total}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Grid container spacing={2}>
                {Object.keys(STATUS_THAI).map((status) => (
                  <Grid item xs={12} sm={4} key={status}>
                    <Typography variant="subtitle1" gutterBottom>
                      {STATUS_THAI[status]}: {component[status]}
                    </Typography>
                    <DoughnutChart data={component} status={status} />
                  </Grid>
                ))}
              </Grid>
              <form onSubmit={handleStatusUpdate}>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>จากสถานะ</InputLabel>
                      <Select
                        value={statusUpdate.fromStatus}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, fromStatus: e.target.value }))}
                      >
                        {Object.entries(STATUS_THAI).map(([key, value]) => (
                          <MenuItem key={key} value={key}>{value}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel>ไปยังสถานะ</InputLabel>
                      <Select
                        value={statusUpdate.toStatus}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, toStatus: e.target.value }))}
                      >
                        {Object.entries(STATUS_THAI).map(([key, value]) => (
                          <MenuItem key={key} value={key}>{value}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="จำนวน"
                      value={statusUpdate.quantity}
                      onChange={(e) => setStatusUpdate(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button type="submit" variant="contained" color="primary" fullWidth>
                      อัปเดตสถานะ
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

const ProjectRowTab2 = memo(({ project, onUpdateStatus }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{project.project_code}</TableCell>
        <TableCell>{project.name}</TableCell>
        <TableCell align="right">{project.components.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                ชิ้นงานอื่นๆ
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>ชื่อชิ้นงาน</TableCell>
                    <TableCell align="right">จำนวนทั้งหมด</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.components.map((component) => (
                    <ComponentRow key={component.id} component={component} onUpdateStatus={onUpdateStatus} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

const Tab2Content = memo(({ isSmallScreen }) => {
  const theme = useTheme();
  const [projects, setProjects] = useState(mockDataTab2);

  const handleUpdateStatus = useCallback((componentId, fromStatus, toStatus, quantity) => {
    setProjects(prevProjects => 
      prevProjects.map(project => ({
        ...project,
        components: project.components.map(component => 
          component.id === componentId
            ? {
                ...component,
                [fromStatus]: component[fromStatus] - quantity,
                [toStatus]: component[toStatus] + quantity
              }
            : component
        )
      }))
    );
  }, []);

  return (
    <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <TableContainer>
        <Table aria-label="collapsible table" size={isSmallScreen ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <StyledTableCell />
              <StyledTableCell>รหัสโครงการ</StyledTableCell>
              <StyledTableCell>ชื่อโครงการ</StyledTableCell>
              <StyledTableCell align="right">จำนวนชิ้นงาน</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <ProjectRowTab2 key={project.id} project={project} onUpdateStatus={handleUpdateStatus} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

// Mock data for Tab 2
const mockDataTab2 = [
  {
    id: '1',
    project_code: 'PRJ001',
    name: 'Project A',
    components: [
      {
        id: 'C1',
        name: 'Component 1',
        total: 100,
        manufactured: 60,
        transported: 30,
        rejected: 10
      },
      {
        id: 'C2',
        name: 'Component 2',
        total: 150,
        manufactured: 100,
        transported: 40,
        rejected: 10
      }
    ]
  },
  {
    id: '2',
    project_code: 'PRJ002',
    name: 'Project B',
    components: [
      {
        id: 'C3',
        name: 'Component 3',
        total: 200,
        manufactured: 150,
        transported: 30,
        rejected: 20
      }
    ]
  }
];

export default Tab2Content;