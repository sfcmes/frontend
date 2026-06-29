// ProjectListPanelHelpers.js
import React, { useState, memo } from 'react';
import {
  Box,
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Dialog,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

// Styled Components
export const Search = styled('div')(({ theme }) => ({
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

export const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const StyledInputBase = styled(InputBase)(({ theme }) => ({
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

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    fontSize: '0.8rem',
  },
}));

// Role-based permissions configuration
export const ROLE_PERMISSIONS = {
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

// CircularProgressWithLabel Component
export function CircularProgressWithLabel({ value }) {
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
export const ProjectRow = memo(
  ({ project, userRole, selectedProjectId, onProjectSelect, isSmallScreen, userProjectIds }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [localProject, setLocalProject] = useState(project);
    const theme = useTheme();

    // Check if user has permission to edit this project
    const hasProjectPermission = useMemo(() => {
      return userProjectIds?.includes(project.id);
    }, [userProjectIds, project.id]);

    // Determine if user can edit based on role and project permission
    const canEditProject = useMemo(() => {
      const permissions = ROLE_PERMISSIONS[userRole] || {};
      if (permissions.canEditAll) return true;
      if (permissions.canEditProjectSpecific && hasProjectPermission) return true;
      return false;
    }, [userRole, hasProjectPermission]);

    const handleRowClick = useCallback(() => {
      setModalOpen(true);
      onProjectSelect(project);
    }, [project, onProjectSelect]);

    // Effect for loading progress simulation
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
    const totalComponents = project.sections?.reduce(
      (acc, section) => acc + (section?.components?.length || 0),
      0,
    ) || 0;

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
              canEdit={canEditProject}
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