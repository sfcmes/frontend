import React, { useCallback, useRef } from 'react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ProjectRow from './ProjectRow';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    fontSize: '0.8rem',
  },
}));

const ProjectList = ({ 
  projects, 
  onRowClick, 
  isSmallScreen, 
  onProjectUpdate, 
  loadMore, 
  hasMore, 
  loading 
}) => {
  const observer = useRef();
  const lastProjectElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore]);

  if (projects.length === 0 && !loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography>No projects found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
      <TableContainer>
        <Table aria-label="collapsible table" size={isSmallScreen ? 'small' : 'medium'}>
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
            {projects.map((project, index) => (
              <ProjectRow
                ref={projects.length === index + 1 ? lastProjectElementRef : null}
                key={project.id}
                project={project}
                onRowClick={onRowClick}
                isSmallScreen={isSmallScreen}
                onProjectUpdate={onProjectUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {loading && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography>Loading more projects...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProjectList;