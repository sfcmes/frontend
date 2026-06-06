import React from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, Box, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ResponsiveDialog = () => {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        Open Project Details
      </Button>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          {"Project Details"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Skyrise (Tower D)</Typography>
            <TableContainer component={Paper}>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>รหัส</TableCell>
                    <TableCell>โครงการ</TableCell>
                    <TableCell>Approve</TableCell>
                    <TableCell>สถานะงานไฟสรุปด้าน</TableCell>
                    {/* Add more headers as necessary */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>SKD</TableCell>
                    <TableCell>Skyrise (Tower D)</TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                      {/* Example data, replace with actual data */}
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
                          {/* Add more rows as necessary */}
                        </TableBody>
                      </Table>
                    </TableCell>
                    {/* Add more cells as necessary */}
                  </TableRow>
                  {/* Add more rows as necessary */}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Skyrise (Tower E)</Typography>
            <TableContainer component={Paper}>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>รหัส</TableCell>
                    <TableCell>โครงการ</TableCell>
                    <TableCell>Approve</TableCell>
                    <TableCell>สถานะงานไฟสรุปด้าน</TableCell>
                    {/* Add more headers as necessary */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>SKE</TableCell>
                    <TableCell>Skyrise (Tower E)</TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                      {/* Example data, replace with actual data */}
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
                          {/* Add more rows as necessary */}
                        </TableBody>
                      </Table>
                    </TableCell>
                    {/* Add more cells as necessary */}
                  </TableRow>
                  {/* Add more rows as necessary */}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          {/* Repeat similar blocks for other sections */}
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResponsiveDialog;
