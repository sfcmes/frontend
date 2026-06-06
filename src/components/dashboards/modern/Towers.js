import React, { useState } from 'react';
import { Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button } from '@mui/material';
import TowersModal from './TowersModal';

const Towers = () => {
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
        <Typography variant="h6">Towers Management</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenModal(null)}>Add Tower</Button>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tower Code</TableCell>
              <TableCell>Tower Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Sample Data */}
            <TableRow>
              <TableCell>SKD</TableCell>
              <TableCell>Skyrise (Tower D)</TableCell>
              <TableCell>
                <Button variant="contained" color="primary" onClick={() => handleOpenModal({ code: 'SKD', name: 'Skyrise (Tower D)' })}>Edit</Button>
                <Button variant="contained" color="error">Delete</Button>
              </TableCell>
            </TableRow>
            {/* Add more rows as needed */}
          </TableBody>
        </Table>
      </CardContent>
      <TowersModal open={modalOpen} handleClose={handleCloseModal} data={currentData} handleSave={handleSaveData} />
    </Card>
  );
};

export default Towers;
