import React, { useState, memo, useCallback } from 'react';
import { TableRow, TableCell, IconButton, Collapse, Box, Typography, Grid } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SectionRow from './SectionRow';

const ProjectRow = memo(({ project, onRowClick, isSmallScreen, onProjectUpdate }) => {
  const [open, setOpen] = useState(false);

  const numberOfSections = project.sections.length;
  const totalComponents = project.sections.reduce(
    (acc, section) => acc + section.components.length,
    0
  );

  const handleRowClick = useCallback(() => {
    onRowClick(project);
  }, [onRowClick, project]);

  const handleIconClick = useCallback((event) => {
    event.stopPropagation();
    setOpen((prevOpen) => !prevOpen); // Correctly toggle the open state
  }, []);

  const handleSectionUpdate = useCallback(
    (sectionId, updatedComponents) => {
      const updatedSections = project.sections.map((section) =>
        section.id === sectionId ? { ...section, components: updatedComponents } : section
      );
      onProjectUpdate(project.id, { ...project, sections: updatedSections });
    },
    [project, onProjectUpdate]
  );

  return (
    <>
      <TableRow onClick={handleRowClick} style={{ cursor: 'pointer' }}>
        <TableCell>
          <IconButton size="small" onClick={handleIconClick}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{project.project_code}</TableCell>
        {!isSmallScreen && <TableCell>{project.name}</TableCell>}
        {!isSmallScreen && <TableCell align="right">{numberOfSections}</TableCell>}
        <TableCell align="right">{totalComponents}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={isSmallScreen ? 3 : 5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                ชั้น
              </Typography>
              <Grid container spacing={1}>
                {project.sections.map((section) => (
                  <SectionRow
                    key={section.id}
                    section={section}
                    projectCode={project.project_code}
                    isSmallScreen={isSmallScreen}
                    onComponentUpdate={handleSectionUpdate}
                  />
                ))}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
});

export default ProjectRow;
