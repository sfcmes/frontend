import React, { useState } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button } from '@mui/material';
import UnitsModal from './UnitsModal';

const Units = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentData, setCurrentData] = useState(null);

  const handleOpenModal = (data) => {
    setCurrentData(data);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentData(null);
  };

  const handleSaveData = (data) => {
    console.log('Saving data', data); // Implement saving logic here
    handleCloseModal();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Units Management</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenModal(null)}>Add Unit</Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Unit Number</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Sample Data */}
            <TableRow>
              <TableCell>11</TableCell>
              <TableCell>Approved</TableCell>
              <TableCell>
                <Button variant="contained" color="primary" onClick={() => handleOpenModal({ unitNumber: 11, status: 'Approved' })}>Edit</Button>
                <Button variant="contained" color="error">Delete</Button>
              </TableCell>
            </TableRow>
            {/* Add more rows as needed */}
          </TableBody>
        </Table>
      </CardContent>
      <UnitsModal open={modalOpen} handleClose={handleCloseModal} data={currentData} handleSave={handleSaveData} />
    </Card>
  );
};

export default Units;
