import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Table, TableHead, TableRow, TableCell, Typography, TableBody, IconButton, Chip, Stack,
  Avatar, Tooltip, TextField, Pagination, TableContainer, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import { fetchTickets, DeleteTicket, SearchTicket } from '../../../store/apps/tickets/TicketSlice';
import { IconTrash } from '@tabler/icons';

const TicketListing = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const handleRowDoubleClick = (ticket) => {
    setSelectedTicket(ticket);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTicket(null);
  };

  const getVisibleTickets = (tickets, filter, ticketSearch) => {
    switch (filter) {
      case 'total_tickets':
        return tickets.filter(
          (c) => !c.deleted && c.ticketTitle.toLocaleLowerCase().includes(ticketSearch),
        );
      case 'Pending':
        return tickets.filter(
          (c) =>
            !c.deleted &&
            c.Status === 'Pending' &&
            c.ticketTitle.toLocaleLowerCase().includes(ticketSearch),
        );
      case 'Closed':
        return tickets.filter(
          (c) =>
            !c.deleted &&
            c.Status === 'Closed' &&
            c.ticketTitle.toLocaleLowerCase().includes(ticketSearch),
        );
      case 'Open':
        return tickets.filter(
          (c) =>
            !c.deleted &&
            c.Status === 'Open' &&
            c.ticketTitle.toLocaleLowerCase().includes(ticketSearch),
        );
      default:
        throw new Error(`Unknown filter: ${filter}`);
    }
  };

  const tickets = useSelector((state) =>
    getVisibleTickets(
      state.ticketReducer.tickets,
      state.ticketReducer.currentFilter,
      state.ticketReducer.ticketSearch,
    ),
  );

  return (
    <Box mt={4}>
      <Box sx={{ maxWidth: '260px', ml: 'auto' }} mb={3}>
        <TextField
          size="small"
          label="Search"
          fullWidth
          onChange={(e) => dispatch(SearchTicket(e.target.value))}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="h6">Id</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="h6">Project</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="h6">Assigned To</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="h6">Status</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="h6">Date</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h6">Action</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.Id} hover onDoubleClick={() => handleRowDoubleClick(ticket)}>
                <TableCell>{ticket.Id}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="h6" fontWeight="500" noWrap>
                      {ticket.ticketTitle}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      noWrap
                      sx={{ maxWidth: '250px' }}
                      variant="subtitle2"
                      fontWeight="400"
                    >
                      {ticket.ticketDescription}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Stack direction="row" gap="10px" alignItems="center">
                    <Avatar
                      src={ticket.thumb}
                      alt={ticket.thumb}
                      width="35"
                      sx={{
                        borderRadius: '100%',
                      }}
                    />
                    <Typography variant="h6">{ticket.AgentName}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    sx={{
                      backgroundColor:
                        ticket.Status === 'Open'
                          ? (theme) => theme.palette.success.light
                          : ticket.Status === 'Closed'
                            ? (theme) => theme.palette.error.light
                            : ticket.Status === 'Pending'
                              ? (theme) => theme.palette.warning.light
                              : ticket.Status === 'Moderate',
                    }}
                    size="small"
                    label={ticket.Status}
                  />
                </TableCell>
                <TableCell>
                  <Typography>{ticket.Date}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Delete Ticket">
                    <IconButton onClick={() => dispatch(DeleteTicket(ticket.Id))}>
                      <IconTrash size="18" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box my={3} display="flex" justifyContent={'center'}>
        <Pagination count={10} color="primary" />
      </Box>

      {/* Modal Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
        fullWidth
        maxWidth="md"
      >
        <DialogTitle id="responsive-dialog-title">Project Details</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box>
              <Typography variant="h6">Project Code: {selectedTicket.Id}</Typography>
              <Typography variant="h6">Project Name: {selectedTicket.ticketTitle}</Typography>
              <TableContainer component={Paper}>
                <Table aria-label="project details">
                  <TableHead>
                    <TableRow>
                      <TableCell>รหัส</TableCell>
                      <TableCell>โครงการ</TableCell>
                      <TableCell>Approve</TableCell>
                      <TableCell>สถานะงานไฟสรุปด้าน</TableCell>
                      <TableCell>ชั้น</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{selectedTicket.Id}</TableCell>
                      <TableCell>{selectedTicket.ticketTitle}</TableCell>
                      <TableCell></TableCell>
                      <TableCell>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>1</TableCell>
                              <TableCell>2</TableCell>
                              <TableCell>3</TableCell>
                              <TableCell>4</TableCell>
                              <TableCell>5</TableCell>
                              <TableCell>6</TableCell>
                              <TableCell>7</TableCell>
                              <TableCell>8</TableCell>
                              <TableCell>9</TableCell>
                              <TableCell>10</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>11</TableCell>
                              <TableCell>12</TableCell>
                              <TableCell>13</TableCell>
                              <TableCell>14</TableCell>
                              <TableCell>15</TableCell>
                              <TableCell>16</TableCell>
                              <TableCell>17</TableCell>
                              <TableCell>18</TableCell>
                              <TableCell>19</TableCell>
                              <TableCell>20</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableCell>
                      <TableCell>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>1</TableCell>
                              <TableCell>2</TableCell>
                              <TableCell>3</TableCell>
                              <TableCell>4</TableCell>
                              <TableCell>5</TableCell>
                              <TableCell>6</TableCell>
                              <TableCell>7</TableCell>
                              <TableCell>8</TableCell>
                              <TableCell>9</TableCell>
                              <TableCell>10</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>11</TableCell>
                              <TableCell>12</TableCell>
                              <TableCell>13</TableCell>
                              <TableCell>14</TableCell>
                              <TableCell>15</TableCell>
                              <TableCell>16</TableCell>
                              <TableCell>17</TableCell>
                              <TableCell>18</TableCell>
                              <TableCell>19</TableCell>
                              <TableCell>20</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Other Details</Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>รหัส</TableCell>
                        <TableCell>โครงการ</TableCell>
                        <TableCell>Approve</TableCell>
                        <TableCell>สถานะงานไฟสรุปด้าน</TableCell>
                        <TableCell>ชั้น</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>UA</TableCell>
                        <TableCell>ลูกขั้นบันใด UOB (TOWER A)</TableCell>
                        <TableCell>MST</TableCell>
                        <TableCell>FST</TableCell>
                        <TableCell>ST4</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>UB</TableCell>
                        <TableCell>ลูกขั้นบันใด UOB (TOWER B)</TableCell>
                        <TableCell>MST</TableCell>
                        <TableCell>FST</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketListing;
