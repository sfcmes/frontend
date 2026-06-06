import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import ProjectRow from './ProjectRow';

const Tab1Content = ({ filteredProjects, onRowClick, isSmallScreen, onProjectUpdate, userRole, StyledTableCell }) => {
  return (
    <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
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
            {filteredProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onRowClick={onRowClick}
                isSmallScreen={isSmallScreen}
                onProjectUpdate={onProjectUpdate}
                userRole={userRole}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {filteredProjects.length === 0 && (
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
    </Box>
  );
};

export default Tab1Content;