import React, { useState } from 'react';
import {
  TableCell,
  TableRow,
  IconButton,
  Typography,
  Collapse,
  Box,
  Grid,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ComponentCard from './ComponentCard';
import ComponentDialog from './ComponentDialog';
import { StatusChip, statusOrder, statusDisplayMap } from './utils';

const SectionRow = ({ section, projectCode, isSmallScreen, onComponentUpdate }) => {
  const [open, setOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);

  const sortedComponents = section.components.sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  );

  const statusCounts = section.components.reduce((acc, component) => {
    acc[component.status] = (acc[component.status] || 0) + 1;
    return acc;
  }, {});

  const handleComponentUpdate = (updatedComponent) => {
    const updatedComponents = section.components.map(comp => 
      comp.id === updatedComponent.id ? updatedComponent : comp
    );
    onComponentUpdate(section.id, updatedComponents);
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell colSpan={isSmallScreen ? 1 : 2}>ชั้น {section.id}</TableCell>
        {!isSmallScreen && <TableCell align="right">{section.components.length} ชิ้นงาน</TableCell>}
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={isSmallScreen ? 2 : 5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                ชิ้นงาน
              </Typography>
              <Box display="flex" flexWrap="wrap" justifyContent="flex-start" mb={2}>
                {statusOrder.map((status) => {
                  const count = statusCounts[status] || 0;
                  if (count > 0) {
                    return (
                      <StatusChip
                        key={status}
                        status={status}
                        label={`${statusDisplayMap[status]}: ${count}`}
                      />
                    );
                  }
                  return null;
                })}
              </Box>
              <Grid container spacing={1}>
                {sortedComponents.map((component) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={component.id}>
                    <ComponentCard
                      component={component}
                      onComponentClick={() => setSelectedComponent(component)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      {selectedComponent && (
        <ComponentDialog
          open={Boolean(selectedComponent)}
          onClose={() => setSelectedComponent(null)}
          component={selectedComponent}
          projectCode={projectCode}
          onComponentUpdate={handleComponentUpdate}
        />
      )}
    </>
  );
};

export default SectionRow;