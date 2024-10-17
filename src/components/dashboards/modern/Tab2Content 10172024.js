import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  useMediaQuery,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  AppBar,
  Toolbar,
  Stack,
  Avatar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import Chart from 'react-apexcharts';
import { fetchProjectsWithOtherComponents, updateOtherComponentStatus } from 'src/utils/api';

// นำเข้าไอคอน
import tiebeamIcon from 'src/assets/card-icons/tiebeam.png';
import carstopIcon from 'src/assets/card-icons/carstop.png';
import holeIcon from 'src/assets/card-icons/hole.png';

const COLORS = {
  planning: '#64b5f6',
  manufactured: '#82ca9d',
  transported: '#ffc658',
  rejected: '#ff6b6b',
};

const STATUS_THAI = {
  planning: 'รอผลิต',
  manufactured: 'ผลิตแล้ว',
  transported: 'ขนส่งสำเร็จ',
  rejected: 'ถูกปฏิเสธ',
};

const getStatusColor = (status) => {
  return { bg: COLORS[status], color: '#ffffff' };
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const DoughnutChart = memo(({ data, status }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { bg } = getStatusColor(status);

  const statusQuantity = data.statuses[status] || 0;
  const totalForPercentage = data.total > 0 ? data.total : 1;

  const percentage = ((statusQuantity / totalForPercentage) * 100).toFixed(1);

  const options = {
    chart: {
      type: 'donut',
      background: 'transparent',
      parentHeightOffset: 0,
    },
    labels: [STATUS_THAI[status], 'อื่นๆ'],
    colors: [bg, theme.palette.grey[300]],
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: false,
              fontSize: isSmallScreen ? '12px' : '14px',
              color: theme.palette.text.secondary,
              offsetY: 0,
            },
            value: {
              show: true,
              fontSize: isSmallScreen ? '14px' : '16px',
              color: theme.palette.text.primary,
              formatter: () => `${percentage}%`,
            },
            total: {
              show: true,
              showAlways: true,
              label: STATUS_THAI[status],
              fontSize: isSmallScreen ? '12px' : '14px',
              color: theme.palette.text.secondary,
              formatter: () => `${percentage}%`,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (value) => `${value}`,
      },
    },
    stroke: { show: false },
    responsive: [
      {
        breakpoint: 600,
        options: {
          plotOptions: {
            pie: {
              donut: {
                size: '60%',
              },
            },
          },
        },
      },
    ],
  };

  const series = [statusQuantity, Math.max(totalForPercentage - statusQuantity, 0)];

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 120,
        height: 120,
        margin: '0 auto',
        cursor: 'pointer',
      }}
    >
      <Chart options={options} series={series} type="donut" width="100%" height="100%" />
    </Box>
  );
});

const ComponentRow = memo(({ component, isLoggedIn, onUpdateStatus, refreshData }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [statusUpdate, setStatusUpdate] = useState({
    fromStatus: '',
    toStatus: '',
    quantity: 0,
  });
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = useCallback(
    (e) => {
      e.preventDefault();
      const { fromStatus, toStatus, quantity } = statusUpdate;

      const quantityNumber = parseInt(quantity, 10);
      if (
        isNaN(quantityNumber) ||
        quantityNumber <= 0 ||
        quantityNumber > (component.statuses[fromStatus] || 0)
      ) {
        setError('จำนวนไม่ถูกต้อง');
        return;
      }

      const validTransitions = {
        planning: ['manufactured', 'rejected'],
        manufactured: ['transported', 'rejected', 'planning'],
        transported: ['rejected', 'manufactured', 'planning'],
        rejected: ['planning'],
      };

      if (!validTransitions[fromStatus].includes(toStatus)) {
        setError('การเปลี่ยนสถานะไม่ถูกต้อง');
        return;
      }

      setIsUpdating(true);
      onUpdateStatus(component.id, fromStatus, toStatus, quantityNumber)
        .then(() => {
          setStatusUpdate({ fromStatus: '', toStatus: '', quantity: 0 });
          setError('');
          refreshData();
        })
        .catch((err) => {
          setError(err.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
        })
        .finally(() => {
          setIsUpdating(false);
        });
    },
    [statusUpdate, component, onUpdateStatus, refreshData],
  );

  const statusOrder = ['planning', 'manufactured', 'transported', 'rejected'];

  return (
    <Card
      sx={{
        mb: 2,
        width: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <CardContent>
        <Typography variant="subtitle1">{component.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          จำนวนทั้งหมด: {component.total}
        </Typography>
        <Box mt={2}>
          <Grid container spacing={2} justifyContent="center">
            {statusOrder.map((status) => (
              <Grid item xs={6} sm={3} key={status}>
                <Typography variant="caption" sx={{ color: COLORS[status], fontWeight: 'bold' }}>
                  {STATUS_THAI[status]}: {component.statuses[status] || 0}
                </Typography>
                <DoughnutChart data={component} status={status} />
              </Grid>
            ))}
          </Grid>
          {isLoggedIn && (
            <form onSubmit={handleStatusUpdate}>
              <Grid container spacing={2} alignItems="flex-end" sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>จากสถานะ</InputLabel>
                    <Select
                      value={statusUpdate.fromStatus}
                      onChange={(e) =>
                        setStatusUpdate((prev) => ({
                          ...prev,
                          fromStatus: e.target.value,
                        }))
                      }
                    >
                      {statusOrder.map((status) => (
                        <MenuItem key={status} value={status}>
                          {STATUS_THAI[status]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>ไปยังสถานะ</InputLabel>
                    <Select
                      value={statusUpdate.toStatus}
                      onChange={(e) =>
                        setStatusUpdate((prev) => ({
                          ...prev,
                          toStatus: e.target.value,
                        }))
                      }
                    >
                      {statusOrder.map((status) => (
                        <MenuItem key={status} value={status}>
                          {STATUS_THAI[status]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="text"
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    label="จำนวน"
                    value={statusUpdate.quantity}
                    onChange={(e) =>
                      setStatusUpdate((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="small"
                    disabled={isUpdating}
                  >
                    {isUpdating ? <CircularProgress size={24} /> : 'อัพเดตสถานะ'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}
          {error && (
            <Typography color="error" sx={{ mt: 1 }} variant="body2">
              {error}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

const ProjectRowTab2 = memo(
  ({ project, isLoggedIn, onUpdateStatus, refreshData, onProjectSelect }) => {
    const [open, setOpen] = useState(false);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    // ฟังก์ชันสำหรับเลือกไอคอนตามรหัสโครงการ
    const getProjectIcon = (projectCode) => {
      if (
        projectCode.startsWith('เสาเอ็น') 
      ) {
        return tiebeamIcon;
      }
      if (
        projectCode.startsWith('คันกั้นล้อ') 
      ) {
        return carstopIcon;
      }
      if (
        projectCode.startsWith('บ่อ')
      ) {
        return holeIcon;
      }
      // เพิ่มเงื่อนไขอื่น ๆ ถ้าจำเป็น
      return null; // หรือกำหนดไอคอนเริ่มต้น
    };

    const handleOpen = () => {
      setOpen(true);
      if (typeof onProjectSelect === 'function') {
        onProjectSelect(project);
      }
    };

    const handleClose = () => {
      setOpen(false);
    };

    const memoizedProject = useMemo(() => project, [project]);

    const projectIcon = getProjectIcon(memoizedProject.project_code);

    if (!memoizedProject.components || memoizedProject.components.length === 0) {
      return null;
    }

    return (
      <>
        <Card
          sx={{
            mb: 2,
            p: 2,
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            },
            cursor: 'pointer',
            backgroundColor: theme.palette.background.paper,
          }}
          onClick={handleOpen}
        >
          <CardContent>
            <Avatar
              src={projectIcon}
              sx={{ height: 80, width: 80, margin: '0 auto' }}
              variant="rounded"
            />
            <Stack direction="column" spacing={2} mt={3} alignItems="center">
              <Typography variant="h6" mb={1}>
                {memoizedProject.name}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                รหัสโครงการ: {memoizedProject.project_code}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                จำนวน Type ของชิ้นงาน: {memoizedProject.components.length}
              </Typography>
            </Stack>
            {/* สามารถเพิ่มเนื้อหาเพิ่มเติมได้ตามต้องการ */}
          </CardContent>
        </Card>

        <Dialog
          fullScreen={isSmallScreen}
          open={open}
          onClose={handleClose}
          TransitionComponent={Transition}
          maxWidth="lg"
          fullWidth
        >
          {isSmallScreen ? (
            <AppBar sx={{ position: 'relative' }}>
              <Toolbar>
                <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                  <CloseIcon />
                </IconButton>
                <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                  {memoizedProject.name}
                </Typography>
              </Toolbar>
            </AppBar>
          ) : (
            <DialogTitle>{memoizedProject.name}</DialogTitle>
          )}
          <DialogContent
            sx={{
              padding: theme.spacing(3),
              [theme.breakpoints.up('md')]: {
                minHeight: '70vh',
                maxHeight: '80vh',
                overflowY: 'auto',
              },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              รหัสโครงการ: {memoizedProject.project_code}
            </Typography>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              ชิ้นงานอื่นๆ
            </Typography>
            <Grid container spacing={2}>
              {memoizedProject.components.map((component) => (
                <Grid item xs={12} md={6} key={component.id}>
                  <ComponentRow
                    component={component}
                    isLoggedIn={isLoggedIn}
                    onUpdateStatus={onUpdateStatus}
                    refreshData={refreshData}
                  />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          {!isSmallScreen && (
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                ปิด
              </Button>
            </DialogActions>
          )}
        </Dialog>
      </>
    );
  },
);
const Tab2Content = memo(({ onProjectSelect }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const theme = useTheme();

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProjectsWithOtherComponents();
      setProjects(data);
      setIsLoggedIn(!!localStorage.getItem('token'));
    } catch (err) {
      console.error('Error fetching projects with other components:', err);
      setError('Failed to fetch projects with other components');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleUpdateStatus = useCallback(
    async (componentId, fromStatus, toStatus, quantity) => {
      if (!isLoggedIn) {
        setSnackbar({
          open: true,
          message: 'คุณต้องเข้าสู่ระบบเพื่อทำการอัพเดต',
          severity: 'warning',
        });
        return;
      }

      try {
        await updateOtherComponentStatus(componentId, fromStatus, toStatus, parseInt(quantity, 10));

        setProjects((prevProjects) =>
          prevProjects.map((project) => ({
            ...project,
            components: project.components.map((component) => {
              if (component.id === componentId) {
                const updatedStatuses = { ...component.statuses };

                // ลดจำนวนจากสถานะต้นทาง (ยกเว้น manufactured)
                if (fromStatus !== 'manufactured') {
                  updatedStatuses[fromStatus] = Math.max(
                    0,
                    (updatedStatuses[fromStatus] || 0) - quantity,
                  );
                }

                // เพิ่มจำนวนไปยังสถานะปลายทาง
                updatedStatuses[toStatus] = (updatedStatuses[toStatus] || 0) + quantity;

                // กรณีพิเศษสำหรับ manufactured และ transported
                if (fromStatus === 'manufactured' && toStatus === 'transported') {
                  // ไม่ลด manufactured เมื่อย้ายไป transported
                  updatedStatuses['manufactured'] = component.statuses['manufactured'] || 0;
                }

                console.log('Updated statuses:', updatedStatuses);

                return { ...component, statuses: updatedStatuses };
              }
              return component;
            }),
          })),
        );

        setSnackbar({ open: true, message: 'สถานะอัพเดตเรียบร้อยแล้ว', severity: 'success' });
      } catch (err) {
        console.error('Failed to update status:', err);
        setSnackbar({
          open: true,
          message: err.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ',
          severity: 'error',
        });
      }
    },
    [isLoggedIn, setProjects, setSnackbar],
  );

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 2 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="300px">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectRowTab2
                project={project}
                isLoggedIn={isLoggedIn}
                onUpdateStatus={handleUpdateStatus}
                refreshData={loadProjects}
                onProjectSelect={onProjectSelect}
              />
            </Grid>
          ))}
          {projects.length === 0 && (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                <Typography>ไม่พบโครงการที่มีชิ้นงานอื่นๆ</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

export default Tab2Content;