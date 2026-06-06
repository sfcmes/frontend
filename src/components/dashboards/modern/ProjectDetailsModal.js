import React from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper
} from '@mui/material';

const ProjectDetailsModal = ({ open, handleClose, project }) => {
  if (!project) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Project Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">{project.name}</Typography>
          <Typography variant="subtitle1">Code: {project.code}</Typography>
          <Typography variant="subtitle1">Status: {project.status}</Typography>
          <Typography variant="subtitle1">Progress: {project.progress}%</Typography>
        </Box>
        {project.towers && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Towers</Typography>
            <TableContainer component={Paper}>
              <Table aria-label="towers table">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.towers.map((tower) => (
                    <TableRow key={tower.id}>
                      <TableCell>{tower.code}</TableCell>
                      <TableCell>{tower.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        {project.floors && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Floors</Typography>
            <TableContainer component={Paper}>
              <Table aria-label="floors table">
                <TableHead>
                  <TableRow>
                    <TableCell>Tower Code</TableCell>
                    <TableCell>Floor Number</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.floors.map((floor) => (
                    <TableRow key={floor.id}>
                      <TableCell>{floor.towerCode}</TableCell>
                      <TableCell>{floor.floorNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        {project.units && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Units</Typography>
            <TableContainer component={Paper}>
              <Table aria-label="units table">
                <TableHead>
                  <TableRow>
                    <TableCell>Floor Number</TableCell>
                    <TableCell>Unit Number</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell>{unit.floorNumber}</TableCell>
                      <TableCell>{unit.unitNumber}</TableCell>
                      <TableCell>{unit.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectDetailsModal;
