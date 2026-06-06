import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip } from '@mui/material';

const SectionsTable = ({ sections, onSectionClick }) => (
  <TableContainer>
    <Table
      aria-label="sections table"
      sx={{
        whiteSpace: 'nowrap',
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell>
            <Typography variant="subtitle2" fontWeight={600}>Section ID</Typography>
          </TableCell>
          <TableCell>
            <Typography variant="subtitle2" fontWeight={600}>Section Name</Typography>
          </TableCell>
          <TableCell>
            <Typography variant="subtitle2" fontWeight={600}>Status</Typography>
          </TableCell>
          <TableCell>
            <Typography variant="subtitle2" fontWeight={600}>Components</Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sections.map((section) => (
          <TableRow 
            key={section.section_id} 
            onDoubleClick={() => onSectionClick(section)}
            hover
          >
            <TableCell>{section.section_id}</TableCell>
            <TableCell>{section.section_name}</TableCell>
            <TableCell>
              <Chip
                sx={{
                  bgcolor: (theme) => 
                    section.status === 'Completed' ? theme.palette.success.light :
                    section.status === 'In Progress' ? theme.palette.warning.light :
                    section.status === 'Planning' ? theme.palette.info.light :
                    theme.palette.error.light,
                  color: (theme) => 
                    section.status === 'Completed' ? theme.palette.success.main :
                    section.status === 'In Progress' ? theme.palette.warning.main :
                    section.status === 'Planning' ? theme.palette.info.main :
                    theme.palette.error.main,
                  borderRadius: '8px',
                }}
                size="small"
                label={section.status}
              />
            </TableCell>
            <TableCell>{section.components}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default SectionsTable;
