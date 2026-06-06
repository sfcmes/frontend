import React, { useState, useEffect, memo, useCallback, useMemo, Suspense } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery,
  Tabs,
  Tab,
  InputBase,
  Dialog,
  DialogContent,
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  fetchProjects,
  fetchComponentsByProjectId,
  fetchUserProjects,
  fetchUserProfile,
} from 'src/utils/api';
import Tab2Content from './Tab2Content';

// Lazy load ProjectModal
const ProjectModal = React.lazy(() => import('./ProjectModal'));

// Role-based permissions configuration
const ROLE_PERMISSIONS = {
  Admin: {
    canViewAll: true,
    canEditAll: true,
  },
  Manager: {
    canViewAll: true,
    canEditAll: false,
  },
  User: {
    canViewAll: true,
    canEditAll: false,
  },
  'Site User': {
    canViewAll: true,
    canEditProjectSpecific: true,
  },
};

// Styled Components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    fontSize: '0.8rem',
  },
}));

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
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

// CircularProgressWithLabel Component
function CircularProgressWithLabel({ value }) {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" value={value} size={68} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="caption" component="div" color="text.secondary">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

// ProjectRow Component
const ProjectRow = memo(
  ({ project, userRole, selectedProjectId, onProjectSelect, isSmallScreen, userProjectIds }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [localProject, setLocalProject] = useState(project);
    const theme = useTheme();

    // In TopPerformers.js, update the hasProjectPermission check
    const hasProjectPermission = useMemo(() => {
      const projectId = project?.id?.toString();
      console.log('Checking project permission for:', projectId);
      console.log('User Project IDs:', userProjectIds);

      if (!Array.isArray(userProjectIds) || !projectId) {
        console.log('Invalid project IDs or user project IDs');
        return false;
      }

      // Convert all IDs to strings for comparison
      const hasPermission = userProjectIds.map(String).includes(projectId);

      console.log('Has permission:', hasPermission);
      return hasPermission;
    }, [userProjectIds, project?.id]);

    // Determine if user can edit based on role and project permission
    const canEditProject = useMemo(() => {
      if (userRole === 'Admin') return true;
      if (userRole === 'Site User') return hasProjectPermission;
      return false;
    }, [userRole, hasProjectPermission]);

    const handleRowClick = useCallback(() => {
      setModalOpen(true);
      onProjectSelect(project);
    }, [project, onProjectSelect]);

    useEffect(() => {
      if (modalOpen) {
        const timer = setInterval(() => {
          setLoadingProgress((prevProgress) => {
            const newProgress = prevProgress + 10;
            if (newProgress >= 100) {
              clearInterval(timer);
              return 100;
            }
            return newProgress;
          });
        }, 200);

        return () => {
          clearInterval(timer);
          setLoadingProgress(0);
        };
      }
    }, [modalOpen]);

    const numberOfSections = project.sections?.length || 0;
    const totalComponents =
      project.sections?.reduce((acc, section) => acc + (section?.components?.length || 0), 0) || 0;

    return (
      <>
        <TableRow
          onClick={handleRowClick}
          style={{ cursor: 'pointer' }}
          sx={{
            backgroundColor: project.id === selectedProjectId ? alpha('#64b5f6', 0.5) : 'inherit',
            '&:hover': {
              backgroundColor: alpha('#64b5f6', 0.5),
            },
          }}
        >
          <TableCell>
            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
              <KeyboardArrowDownIcon />
            </IconButton>
          </TableCell>
          <TableCell>{project.project_code}</TableCell>
          {!isSmallScreen && <TableCell>{project.name}</TableCell>}
          {!isSmallScreen && <TableCell align="right">{numberOfSections}</TableCell>}
          <TableCell align="right">{totalComponents}</TableCell>
        </TableRow>

        {modalOpen && (
          <Suspense
            fallback={
              <Dialog open={modalOpen}>
                <DialogContent>
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p={3}
                  >
                    <CircularProgressWithLabel value={loadingProgress} />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      กำลังโหลดข้อมูล...
                    </Typography>
                  </Box>
                </DialogContent>
              </Dialog>
            }
          >
            <ProjectModal
              project={localProject}
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              userRole={userRole}
              canEdit={canEditProject} // ส่ง canEditProject
              userProjectIds={userProjectIds} // เพิ่ม prop นี้
              onProjectSelect={(updatedProject) => {
                setLocalProject(updatedProject);
                onProjectSelect(updatedProject);
                if (!updatedProject) {
                  setModalOpen(false);
                }
              }}
            />
          </Suspense>
        )}
      </>
    );
  },
);

// Main TopPerformers Component
const TopPerformers = memo(({ onProjectSelect, userRole, refreshTrigger, onTabChange, userId }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [state, setState] = useState({
    projects: [],
    selectedProjectId: null,
    loading: true,
    error: null,
    searchTerm: '',
    tabValue: '1',
    userProjectIds: [],
    permissions: {
      canEdit: false,
    },
  });

  // Get user permissions based on role
  const userPermissions = useMemo(
    () =>
      ROLE_PERMISSIONS[userRole] || {
        canViewAll: true,
        canEditAll: false,
        canEditProjectSpecific: false,
      },
    [userRole],
  );

  // Handle search input change
  const handleSearchChange = useCallback((event) => {
    setState((prev) => ({ ...prev, searchTerm: event.target.value }));
  }, []);

  // Handle tab change
  const handleTabChange = useCallback(
    (event, newValue) => {
      setState((prev) => ({ ...prev, tabValue: newValue }));
      onTabChange?.(newValue);
    },
    [onTabChange],
  );

  // Fetch user profile and projects
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (userId) {
          console.log('Loading data for user:', userId);
          const [userProjects, userProfile] = await Promise.all([
            fetchUserProjects(userId),
            fetchUserProfile(),
          ]);

          console.log('Fetched user projects:', userProjects);

          setState((prev) => ({
            ...prev,
            userProjectIds: Array.isArray(userProjects) ? userProjects : [],
            permissions: {
              canEdit:
                userProfile.role === 'Admin' ||
                (userProfile.role === 'Site User' && userProjects.length > 0),
            },
            userRole: userProfile.role,
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setState((prev) => ({
          ...prev,
          error: 'Failed to load user permissions',
          userProjectIds: [],
          permissions: { canEdit: false },
        }));
      }
    };

    loadUserData();
  }, [userId]);

  // Load projects data
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetchProjects();
        if (!response?.data) {
          throw new Error('Invalid projects data received');
        }

        const projectsWithComponents = await Promise.all(
          response.data.map(async (project) => {
            try {
              const components = await fetchComponentsByProjectId(project.id);
              if (!Array.isArray(components) || components.length === 0) {
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
              console.error(`Error processing project ${project.project_code}:`, error);
              return null;
            }
          }),
        );

        setState((prev) => ({
          ...prev,
          projects: projectsWithComponents.filter(Boolean),
          loading: false,
        }));
      } catch (error) {
        console.error('Error fetching projects:', error);
        setState((prev) => ({
          ...prev,
          error: 'Failed to load projects. Please try again.',
          loading: false,
        }));
      }
    };

    loadProjects();
  }, [refreshTrigger]);

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    const searchTerm = state.searchTerm.toLowerCase();
    return state.projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm) ||
        project.project_code.toLowerCase().includes(searchTerm),
    );
  }, [state.projects, state.searchTerm]);

  if (state.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (state.error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <Alert severity="error">{state.error}</Alert>
      </Box>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: isSmallScreen ? 1 : { xs: 1, sm: 2, md: 3 },
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
      }}
    >
      {/* Header with Search */}
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
            placeholder="ค้นหา..."
            value={state.searchTerm}
            onChange={handleSearchChange}
          />
        </Search>
      </Box>

      {/* Role information */}
      <Box mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          สถานะผู้ใช้: {userRole}
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs value={state.tabValue} onChange={handleTabChange}>
        <Tab label="ชิ้นงานพรีคาสท์" value="1" />
        <Tab label="ชิ้นงานอื่นๆ" value="2" />
      </Tabs>

      {/* Projects Table */}
      {state.tabValue === '1' && (
        <TableContainer sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
          <Table stickyHeader size={isSmallScreen ? 'small' : 'medium'}>
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
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    userRole={userRole}
                    selectedProjectId={state.selectedProjectId}
                    onProjectSelect={onProjectSelect}
                    isSmallScreen={isSmallScreen}
                    userProjectIds={state.userProjectIds}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Alert severity="info" sx={{ m: 2 }}>
                      ไม่พบข้อมูล
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 2 Content */}
      {state.tabValue === '2' && (
        <Tab2Content
          isSmallScreen={isSmallScreen}
          onProjectSelect={onProjectSelect}
          userRole={userRole}
          userProjectIds={state.userProjectIds}
          permissions={state.permissions}
        />
      )}
    </Paper>
  );
});

export default TopPerformers;
