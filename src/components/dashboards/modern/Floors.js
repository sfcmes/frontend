import React, { useState } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button } from '@mui/material';
import FloorsModal from './FloorsModal';

const Floors = () => {
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
        <Typography variant="h6">Floors Management</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenModal(null)}>Add Floor</Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Floor Number</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Sample Data */}
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>
                <Button variant="contained" color="primary" onClick={() => handleOpenModal({ floorNumber: 1 })}>Edit</Button>
                <Button variant="contained" color="error">Delete</Button>
              </TableCell>
            </TableRow>
            {/* Add more rows as needed */}
          </TableBody>
        </Table>
      </CardContent>
      <FloorsModal open={modalOpen} handleClose={handleCloseModal} data={currentData} handleSave={handleSaveData} />
    </Card>
  );
};

export default Floors;
