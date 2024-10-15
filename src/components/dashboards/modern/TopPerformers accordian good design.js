import React, { useState, useEffect, memo, useCallback } from 'react';
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
  Button,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  useMediaQuery,
  Tabs,
  Tab,
  InputBase,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import { fetchProjects, fetchComponentsByProjectId } from 'src/utils/api';
import ComponentDialog from './ComponentDialog';
import Tab2Content from './Tab2Content';

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
  planning: '#64b5f6',
  manufactured: '#82ca9d',
  in_transit: '#ffc658',
  accepted: '#8e44ad',
  installed: '#27ae60',
  rejected: '#ff6b6b',
};

const STATUS_THAI = {
  planning: 'วางแผน',
  manufactured: 'ผลิตแล้ว',
  in_transit: 'ขนส่งสำเร็จ',
  accepted: 'ตรวจรับแล้ว',
  installed: 'ติดตั้งแล้ว',
  rejected: 'ถูกปฏิเสธ',
};

const statusOrder = ['planning', 'manufactured', 'in_transit', 'accepted', 'installed', 'rejected'];

const getStatusColor = (status) => {
  return { bg: COLORS[status], color: '#ffffff' };
};

const StatusChip = memo(({ status, label }) => {
  const { bg, color } = getStatusColor(status);
  return (
    <Box
      component="span"
      sx={{
        bgcolor: bg,
        color: color,
        fontWeight: 'bold',
        padding: '4px 8px',
        borderRadius: '16px',
        fontSize: { xs: '0.7rem', sm: '0.9rem' },
        display: 'inline-block',
        margin: '2px',
      }}
    >
      {label}
    </Box>
  );
});

const ComponentCard = memo(({ component, canViewDetails, setSelectedComponent }) => {
  const { bg, color } = getStatusColor(component.status);

  const handleViewDetailsClick = (event) => {
    event.stopPropagation();
    setSelectedComponent(component);
  };

  return (
    <Grid item xs={3} sm={1.1} md={0.9}>
      <Tooltip title={component.name} arrow>
        <Card
          sx={{
            bgcolor: bg,
            height: { xs: '40px', sm: '45px', md: '50px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { xs: '1px', sm: '1px', md: '1px' },
            m: { xs: '1px', sm: '1px', md: '1px' },
            border: '1px solid',
            borderColor: bg,
            cursor: 'pointer',
          }}
        >
          <CardContent
            sx={{ textAlign: 'center', p: { xs: '1px', sm: '1px', md: '1px' } }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: color,
                fontSize: { xs: '5px', sm: '6px', md: '7px' },
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {component.name}
            </Typography>
            {canViewDetails && (
              <Button
                variant="contained"
                size="small"
                onClick={handleViewDetailsClick}
                sx={{
                  mt: { xs: '1px', sm: '1px', md: '1px' },
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: color,
                  fontSize: { xs: '4px', sm: '5px', md: '6px' },
                  p: { xs: '1px 2px', sm: '1px 2px', md: '1px 2px' },
                  minWidth: 'auto',
                }}
              >
                ดูข้อมูล
              </Button>
            )}
          </CardContent>
        </Card>
      </Tooltip>
    </Grid>
  );
});

const SectionRow = memo(({ section, projectCode, isSmallScreen, onComponentUpdate, userRole }) => {
  const [open, setOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);

  const sortedComponents = section.components.sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  );

  const statusCounts = section.components.reduce((acc, component) => {
    acc[component.status] = (acc[component.status] || 0) + 1;
    return acc;
  }, {});

  const handleComponentUpdate = useCallback(
    (updatedComponent) => {
      if (!updatedComponent || !updatedComponent.id) {
        console.error('Updated component is missing or undefined:', updatedComponent);
        return;
      }
      const updatedComponents = section.components.map((comp) =>
        comp.id === updatedComponent.id ? updatedComponent : comp,
      );
      onComponentUpdate(section.id, updatedComponents);
    },
    [section.components, section.id, onComponentUpdate],
  );

  const handleDialogClose = useCallback(() => {
    setSelectedComponent(null);
    onComponentUpdate();
  }, [onComponentUpdate]);

  const canViewDetails = userRole === 'Admin' || userRole === 'Site User';

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell colSpan={isSmallScreen ? 1 : 2}>
          {section.name || `Section ${section.id}`}
        </TableCell>
        {!isSmallScreen && (
          <TableCell align="right">{section.components.length} ชิ้นงาน</TableCell>
        )}
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                ชิ้นงาน
              </Typography>
              <Box display="flex" flexWrap="wrap" justifyContent="flex-start" mb={2}>
                {statusOrder.map((status) => {
                  const count = statusCounts[status] || 0;
                  if (count >= 0) {
                    return (
                      <StatusChip
                        key={status}
                        status={status}
                        label={`${STATUS_THAI[status]}: ${count}`}
                      />
                    );
                  }
                  return null;
                })}
              </Box>
              <Grid container spacing={0.1}>
                {sortedComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    canViewDetails={canViewDetails}
                    setSelectedComponent={setSelectedComponent}
                  />
                ))}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      {selectedComponent && (
        <ComponentDialog
          open={Boolean(selectedComponent)}
          onClose={handleDialogClose}
          component={selectedComponent}
          projectCode={projectCode}
          onComponentUpdate={handleComponentUpdate}
        />
      )}
    </>
  );
});

const ProjectRow = memo(
  ({ project, onRowClick, isSmallScreen, onProjectUpdate, userRole, selectedProjectId }) => {
    const [open, setOpen] = useState(false);

    const theme = useTheme();

    const isSelected = project.id === selectedProjectId;

    useEffect(() => {
      if (isSelected) {
        setOpen(true);
      }
    }, [isSelected]);

    const numberOfSections = project.sections.length;
    const totalComponents = project.sections.reduce(
      (acc, section) => acc + section.components.length,
      0,
    );

    const handleRowClick = useCallback(() => {
      onRowClick(project);
    }, [onRowClick, project]);

    const handleIconClick = useCallback(
      (event) => {
        event.stopPropagation();
        setOpen((prevOpen) => !prevOpen);
      },
      [],
    );

    const handleSectionUpdate = useCallback(
      (sectionId, updatedComponents) => {
        const updatedSections = project.sections.map((section) =>
          section.id === sectionId ? { ...section, components: updatedComponents } : section,
        );
        onProjectUpdate(project.id, { ...project, sections: updatedSections });
      },
      [project, onProjectUpdate],
    );

    const sortedSections = [...project.sections].sort((a, b) => {
      if (a.name && b.name) {
        return a.name.localeCompare(b.name);
      }
      return a.id - b.id;
    });

    return (
      <>
        <TableRow
          onClick={handleRowClick}
          style={{ cursor: 'pointer' }}
          sx={{
            backgroundColor: isSelected ? alpha('#64b5f6', 0.5) : 'inherit',
            color: isSelected ? '#ffffff' : 'inherit',
            '&:hover': {
              backgroundColor: alpha('#64b5f6', 0.5),
              color: '#ffffff',
            },
          }}
        >
          <TableCell>
            <IconButton size="small" onClick={handleIconClick}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell>{project.project_code}</TableCell>
          {!isSmallScreen && <TableCell>{project.name}</TableCell>}
          {!isSmallScreen && <TableCell align="right">{numberOfSections}</TableCell>}
          <TableCell align="right">{totalComponents}</TableCell>
        </TableRow>

        {open && (
          <Box
            sx={{
              marginLeft: 2,
              marginRight: 2,
              marginBottom: 2,
              border: '1px solid #ccc',
              borderRadius: theme.shape.borderRadius,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                maxHeight: 400, // Adjust the height as needed
                overflowY: 'auto',
                position: 'relative',
              }}
            >
              {/* Sticky Header */}
              <Box
                sx={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: alpha('#64b5f6', 0.9),
                  color: '#fff',
                  padding: theme.spacing(1),
                  zIndex: 1,
                }}
              >
                <Typography variant="h6" component="div">
                  {project.name || `Project ${project.project_code}`}
                </Typography>
              </Box>
              {/* End of Sticky Header */}

              <Box sx={{ padding: theme.spacing(2) }}>
                <Typography variant="h6" gutterBottom component="div">
                  ชั้น
                </Typography>
                <Table size="small">
                  <TableBody>
                    {sortedSections.map((section) => (
                      <SectionRow
                        key={section.id}
                        section={section}
                        projectCode={project.project_code}
                        isSmallScreen={isSmallScreen}
                        onComponentUpdate={handleSectionUpdate}
                        userRole={userRole}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Box>
        )}
      </>
    );
  },
);

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
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const TopPerformers = memo(({ onProjectSelect, userRole, refreshTrigger, onTabChange }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tabValue, setTabValue] = useState('1');
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const handleProjectUpdate = useCallback((projectId, updatedProject) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) => (project.id === projectId ? updatedProject : project)),
    );
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    onTabChange(newValue);
  };

  const handleProjectSelect = useCallback(
    (project) => {
      setSelectedProjectId(project.id);
      if (onProjectSelect) {
        onProjectSelect(project);
      }
    },
    [onProjectSelect],
  );

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const response = await fetchProjects();
        console.log(`Fetched ${response.data.length} projects`);

        const projectsWithComponents = await Promise.all(
          response.data.map(async (project) => {
            try {
              const components = await fetchComponentsByProjectId(project.id);

              if (!Array.isArray(components)) {
                console.error(
                  `Components data is not an array for project ${project.project_code}`,
                  components,
                );
                return null;
              }

              const sections = components.reduce((acc, component) => {
                let section = acc.find((sec) => sec.id === component.section_id);
                if (!section) {
                  section = {
                    id: component.section_id,
                    name: component.section_name || `Section ${component.section_id}`,
                    components: [],
                  };
                  acc.push(section);
                }
                section.components.push(component);
                return acc;
              }, []);

              return { ...project, sections };
            } catch (error) {
              console.error(`Error processing project ${project.project_code}:`, error.message);
              return null;
            }
          }),
        );

        setProjects(projectsWithComponents.filter((project) => project !== null));
      } catch (err) {
        console.error('Error fetching projects:', err.message);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [refreshTrigger]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
      }}
    >
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 0 } }}>
          ข้อมูลโครงการ
        </Typography>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="ค้นหา…"
            inputProps={{ 'aria-label': 'search' }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Search>
      </Box>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Top Performers Tabs">
        <Tab label="ชิ้นงานพรีคาสท์" value="1" />
        <Tab label="ชิ้นงานอื่นๆ" value="2" />
      </Tabs>
      {tabValue === '1' && (
        <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <TableContainer>
            <Table
              stickyHeader
              aria-label="collapsible table"
              size={isSmallScreen ? 'small' : 'medium'}
            >
              <TableHead>
                <TableRow>
                  <StyledTableCell />
                  <StyledTableCell>รหัสโครงการ</StyledTableCell>
                  {!isSmallScreen && <StyledTableCell>ชื่อโครงการ</StyledTableCell>}
                  {!isSmallScreen && <StyledTableCell align="right">จำนวนชั้น</StyledTableCell>}
                  <StyledTableCell align="right">จำนวนชิ้นงาน</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProjects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onRowClick={handleProjectSelect}
                    isSmallScreen={isSmallScreen}
                    onProjectUpdate={handleProjectUpdate}
                    userRole={userRole}
                    selectedProjectId={selectedProjectId}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {tabValue === '2' && (
        <Tab2Content
          isSmallScreen={isSmallScreen}
          onProjectSelect={onProjectSelect}
          userRole={userRole}
        />
      )}
      {filteredProjects.length === 0 && tabValue === '1' && (
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>
              <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                <Alert severity="info">ไม่พบข้อมูล</Alert>
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <Button color="inherit" size="small" onClick={handleSnackbarClose}>
            ปิด
          </Button>
        }
      />
    </Paper>
  );
});

export default TopPerformers;