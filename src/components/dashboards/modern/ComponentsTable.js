import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip } from '@mui/material';

const ComponentsTable = ({ components }) => (
  <TableContainer>
    <Table
      aria-label="components table"
      sx={{
        whiteSpace: 'nowrap',
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell>
            <Typography variant="subtitle2" fontWeight={600}>Component ID</Typography>
          </TableCell>
          <TableCell>
            <Typography variant="subtitle2" fontWeight={600}>Component Name</Typography>
          </TableCell>
          <TableCell>
            <Typography variant="subtitle2" fontWeight={600}>Status</Typography>
          </TableCell>
          <TableCell>
            <Typography variant="subtitle2" fontWeight={600}>Type</Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {components.map((component) => (
          <TableRow key={component.component_id} hover>
            <TableCell>{component.component_id}</TableCell>
            <TableCell>{component.component_name}</TableCell>
            <TableCell>
              <Chip
                sx={{
                  bgcolor: (theme) =>
                    component.status === 'Completed'
                      ? theme.palette.success.light
                      : component.status === 'In Progress'
                      ? theme.palette.warning.light
                      : component.status === 'Planning'
                      ? theme.palette.info.light
                      : theme.palette.error.light,
                  color: (theme) =>
                    component.status === 'Completed'
                      ? theme.palette.success.main
                      : component.status === 'In Progress'
                      ? theme.palette.warning.main
                      : component.status === 'Planning'
                      ? theme.palette.info.main
                      : theme.palette.error.main,
                  borderRadius: '8px',
                }}
                size="small"
                label={component.status}
              />
            </TableCell>
            <TableCell>{component.type}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default ComponentsTable;
