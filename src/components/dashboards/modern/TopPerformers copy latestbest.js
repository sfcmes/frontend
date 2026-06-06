import React, { useState, useEffect, memo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  InputBase,
  CircularProgress,
  Alert,
  Snackbar,
  useMediaQuery,
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import GetAppIcon from '@mui/icons-material/GetApp';
import SearchIcon from '@mui/icons-material/Search';
import { 
  fetchProjects, 
  fetchComponentsByProjectId,
  fetchComponentById,
  fetchUserById
} from 'src/utils/api';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.common.white,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    fontSize: '0.8rem',
  },
}));

const statusDisplayMap = {
  Manufactured: 'ผลิตแล้ว',
  'In Transit': 'อยู่ระหว่างขนส่ง',
  Transported: 'ขนส่งสำเร็จ',
  Accepted: 'ตรวจรับแล้ว',
  Installed: 'ติดตั้งแล้ว',
  Rejected: 'ถูกปฏิเสธ',
};


const getStatusColor = (status) => {
  switch (status) {
    case 'Manufactured':
      return '#53b3cb'; // Light blue: Indicates completion of manufacturing
    case 'In Transit':
      return '#e9eb9e'; // Light orange: Represents movement and transportation
    case 'Transported':
      return '#a1869e'; // Light green: Signifies arrival at destination
    case 'Accepted':
      return '#32d2a2'; // Light purple: Denotes approval and acceptance
    case 'Installed':
      return '#adfc92'; // Light cyan: Represents final installation and readiness
    case 'Rejected':
      return '#ed8209'; // Light red: Indicates issues or rejection
    default:
      return '#fefefe'; // Light grey: For unknown or default states
  }
};

// Function to determine text color based on background color for better contrast
const getTextColor = (backgroundColor) => {
  // Colors that need white text
  const darkColors = ['#365486', '#79AC78'];
  return darkColors.includes(backgroundColor) ? '#FFFFFF' : '#000000';
};

const handleFileDownload = (file) => {
  console.log(`Downloading file: ${file.fileName}`);
  window.open(file.url, '_blank');
};

const FileHistoryTable = memo(({ files }) => {
  const theme = useTheme();
  return (
    <TableContainer component={Paper} style={{ marginTop: '20px' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell style={{ color: theme.palette.text.primary }}>ชื่อไฟล์</TableCell>
            <TableCell style={{ color: theme.palette.text.primary }}>เวอร์ชั่น</TableCell>
            <TableCell style={{ color: theme.palette.text.primary }}>อัพโหลดโดย</TableCell>
            <TableCell style={{ color: theme.palette.text.primary }}>วันที่อัพโหลด</TableCell>
            <TableCell style={{ color: theme.palette.text.primary }}>ดาวน์โหลด</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>{file.fileName}</TableCell>
              <TableCell>{file.revision}</TableCell>
              <TableCell>{file.uploadedBy}</TableCell>
              <TableCell>{file.uploadDate}</TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => handleFileDownload(file)}>
                  <GetAppIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

const displayLabels = {
  id: 'รหัสชิ้นงาน',
  name: 'ชื่อชิ้นงาน',
  width: 'ความกว้าง',
  height: 'ความสูง',
  thickness: 'ความหนา',
  weight: 'น้ำหนัก',
  coating: 'คอนกรีต',
  addition: 'ตร.ม เพิ่ม/ลด',
  squareMeters: 'ตารางเมตร',
  status: 'สถานะ',
};

// const ComponentDialog = memo(({ open, onClose, component, projectCode }) => {
//   const [tabValue, setTabValue] = useState(0);
//   const [fileHistory, setFileHistory] = useState([]);

//   useEffect(() => {
//     // TODO: Replace with actual API call to fetch file history
//     const mockFileHistory = [
//       {
//         id: 1,
//         fileName: `${component.name}_Rev1.pdf`,
//         revision: 'Rev 1',
//         uploadedBy: 'John Doe',
//         uploadDate: '2023-01-15',
//         url: '#',
//       },
//       {
//         id: 2,
//         fileName: `${component.name}_Rev2.pdf`,
//         revision: 'Rev 2',
//         uploadedBy: 'Jane Smith',
//         uploadDate: '2023-03-22',
//         url: '#',
//       },
//     ];
//     setFileHistory(mockFileHistory);
//   }, [component.name]);

//   const handleTabChange = (event, newValue) => {
//     setTabValue(newValue);
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
//       <DialogTitle>รายละเอียด: {component.name}</DialogTitle>
//       <DialogContent>
//         <Tabs value={tabValue} onChange={handleTabChange}>
//           <Tab label="รายละเอียดชิ้นงาน" />
//           <Tab label="ไฟล์และประวัติ" />
//         </Tabs>
//         {tabValue === 0 && (
//           <Table size="small">
//             <TableBody>
//               {Object.entries(component).map(([key, value]) => (
//                 <TableRow key={key}>
//                   <TableCell component="th" scope="row">
//                     {displayLabels[key] || key}
//                   </TableCell>
//                   <TableCell align="right">{value}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         )}
//         {tabValue === 1 && <FileHistoryTable files={fileHistory} />}
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={onClose} color="primary">
//           Close
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// });

const ComponentDialog = memo(({ open, onClose, component, projectCode }) => {
  const [tabValue, setTabValue] = useState(0);
  const [componentDetails, setComponentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileError, setFileError] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const details = await fetchComponentById(component.id);
        
        const historyWithUsernames = await Promise.all(
          details.history.map(async (item) => {
            const user = await fetchUserById(item.updated_by);
            return { ...item, username: user.username };
          })
        );
        
        setComponentDetails({ ...details, history: historyWithUsernames });
      } catch (err) {
        console.error('Error fetching component details:', err);
        setError('Failed to load component details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (open && component.id) {
      fetchDetails();
    }
  }, [open, component.id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileDownload = async () => {
    if (componentDetails && componentDetails.file_path) {
      try {
        const response = await fetch(componentDetails.file_path);
        if (!response.ok) {
          throw new Error('File not accessible');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = componentDetails.name + '.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
        setFileError(true);
        setSnackbarMessage('Unable to download file. Please try again later.');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography color="error">{error}</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>รายละเอียด: {componentDetails?.name}</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="รายละเอียดชิ้นงาน" />
            <Tab label="ประวัติสถานะ" />
          </Tabs>
          {tabValue === 0 && componentDetails && (
            <>
              <Table size="small">
                <TableBody>
                  {Object.entries(componentDetails).map(([key, value]) => {
                    if (key !== 'history' && typeof value !== 'object') {
                      return (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row">
                            {displayLabels[key] || key}
                          </TableCell>
                          <TableCell align="right">{value.toString()}</TableCell>
                        </TableRow>
                      );
                    }
                    return null;
                  })}
                </TableBody>
              </Table>
              {componentDetails.file_path && (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<GetAppIcon />}
                    onClick={handleFileDownload}
                    disabled={fileError}
                  >
                    {fileError ? 'File Unavailable' : 'ดาวน์โหลดไฟล์'}
                  </Button>
                </Box>
              )}
            </>
          )}
          {tabValue === 1 && componentDetails && componentDetails.history && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>วันที่อัปเดต</TableCell>
                  <TableCell>อัปเดตโดย</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {componentDetails.history.map((historyItem, index) => (
                  <TableRow key={index}>
                    <TableCell>{historyItem.status}</TableCell>
                    <TableCell>{new Date(historyItem.updated_at).toLocaleString()}</TableCell>
                    <TableCell>{historyItem.username}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
});
const StatusChip = ({ status, count }) => {
  const StyledChip = styled(Chip)(({ theme }) => ({
    backgroundColor: getStatusColor(status),
    color: status === 'Rejected' ? theme.palette.common.white : theme.palette.common.black,
    fontWeight: 'bold',
    margin: '2px',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    height: '32px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.7rem',
      height: '24px',
    },
    [theme.breakpoints.between('sm', 'md')]: {
      fontSize: '0.8rem',
      height: '28px',
    },
    [theme.breakpoints.up('md')]: {
      fontSize: '0.9rem',
      height: '32px',
    },
  }));

  // Use the statusDisplayMap here
  return <StyledChip label={`${statusDisplayMap[status] || status}: ${count}`} />;
};

const SectionRow = memo(({ section, projectCode }) => {
  const [open, setOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);

  const statusCounts = section.components.reduce((acc, component) => {
    if (!acc[component.status]) {
      acc[component.status] = 0;
    }
    acc[component.status]++;
    return acc;
  }, {});

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell colSpan={2}>ชั้น {section.id}</TableCell>
        <TableCell align="right">{section.components.length} ชิ้นงาน</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                ชิ้นงาน
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={2}>
                {[
                  'Manufactured',
                  'In Transit',
                  'Transported',
                  'Accepted',
                  'Installed',
                  'Rejected',
                ].map((status) => (
                  <StatusChip key={status} status={status} count={statusCounts[status] || 0} />
                ))}
              </Box>
              <Box style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Grid container spacing={1}>
                  {section.components.map((component) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={component.id}>
                      <Card
                        style={{
                          backgroundColor: getStatusColor(component.status),
                          color: component.status === 'Rejected' ? 'white' : 'black',
                          height: '85px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '6px',
                          margin: '4px',
                        }}
                      >
                        <CardContent style={{ textAlign: 'center', padding: '3px' }}>
                          <Typography
                            variant="subtitle2"
                            style={{ color: 'inherit', fontSize: '11px', fontWeight: 'bold' }}
                          >
                            {component.name}
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => setSelectedComponent(component)}
                            style={{
                              marginTop: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              color: 'inherit',
                              fontSize: '10px',
                              padding: '2px 6px',
                            }}
                          >
                            ดูข้อมูล
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      {selectedComponent && (
        <ComponentDialog
          open={Boolean(selectedComponent)}
          onClose={() => setSelectedComponent(null)}
          component={selectedComponent}
          projectCode={projectCode}
        />
      )}
    </>
  );
});

const ProjectRow = memo(({ project, onRowClick }) => {
  const [open, setOpen] = useState(false);

  const totalComponents = project.sections.reduce(
    (acc, section) => acc + section.components.length,
    0,
  );

  const handleRowClick = () => {
    onRowClick(project);
  };

  const handleIconClick = (event) => {
    event.stopPropagation();
    setOpen(!open);
  };

  return (
    <>
      <TableRow onClick={handleRowClick} style={{ cursor: 'pointer' }}>
        <TableCell>
          <IconButton size="small" onClick={handleIconClick}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{project.code}</TableCell>
        <TableCell>{project.name}</TableCell>
        <TableCell align="right">{project.sections.length}</TableCell>
        <TableCell align="right">{totalComponents}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                ชั้น
              </Typography>
              <Table size="small">
                <TableBody>
                  {project.sections.map((section) => (
                    <SectionRow key={section.id} section={section} projectCode={project.code} />
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

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const TopPerformers = ({ onRowClick }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const theme = useTheme();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await fetchProjects();
        const projectsWithComponents = await Promise.all(
          response.data.map(async (project) => {
            try {
              const components = await fetchComponentsByProjectId(project.id);
              return {
                ...project,
                sections: [{ id: 1, components }],
              };
            } catch (componentError) {
              console.error(`Error fetching components for project ${project.id}:`, componentError);
              return {
                ...project,
                sections: [{ id: 1, components: [] }],
              };
            }
          }),
        );
        setProjects(projectsWithComponents);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again later.');
        setSnackbarMessage('Failed to load projects. Please try again later.');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          ข้อมูลโครงการ
        </Typography>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Search>
      </Box>
      <TableContainer>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <StyledTableCell />
              <TableCell style={{ color: theme.palette.text.primary, fontSize: '1.2rem' }}>
                รหัสโครงการ
              </TableCell>
              <TableCell style={{ color: theme.palette.text.primary, fontSize: '1.2rem' }}>
                ชื่อโครงการ
              </TableCell>
              <TableCell
                style={{ color: theme.palette.text.primary, fontSize: '1.2rem' }}
                align="right"
              >
                จำนวนชั้น
              </TableCell>
              <TableCell
                style={{ color: theme.palette.text.primary, fontSize: '1.2rem' }}
                align="right"
              >
                จำนวนชิ้นงาน
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map((project) => (
              <ProjectRow key={project.id} project={project} onRowClick={onRowClick} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {filteredProjects.length === 0 && (
        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
          <Typography>No projects found matching your search.</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TopPerformers;
