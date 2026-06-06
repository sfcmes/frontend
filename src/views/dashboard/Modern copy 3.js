import React, { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import WeeklyStats from '../../components/dashboards/modern/WeeklyStats';
import TopPerformers from '../../components/dashboards/modern/TopPerformers';
import Welcome from '../../layouts/full/shared/welcome/Welcome';
import { fetchSectionsByProjectId } from '../../services/projectService';

const Modern = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const getSections = async () => {
      if (selectedProject) {
        const data = await fetchSectionsByProjectId(selectedProject.id);
        console.log('Fetched sections:', data);
        setSections(data || []);
      }
    };
    getSections();
  }, [selectedProject]);

  const calculateProjectStats = (project) => {
    if (!project || !sections || sections.length === 0) return [];

    const totalComponents = sections.reduce((acc, section) => {
      return acc + (section.components ? section.components.length : 0);
    }, 0);

    if (totalComponents === 0) return [];

    const statusCounts = {
      'Manufactured': 0,
      'In Transit': 0,
      'Transported': 0,
      'Installed': 0,
      'Rejected': 0
    };

    sections.forEach(section => {
      if (section.components) {
        section.components.forEach(component => {
          statusCounts[component.status] = (statusCounts[component.status] || 0) + 1;
        });
      }
    });

    return [
      { title: 'Manufactured', subtitle: '', percent: Math.round((statusCounts['Manufactured'] / totalComponents) * 100) },
      { title: 'In Transit', subtitle: '', percent: Math.round((statusCounts['In Transit'] / totalComponents) * 100) },
      { title: 'Transported', subtitle: '', percent: Math.round((statusCounts['Transported'] / totalComponents) * 100) },
      { title: 'Installed', subtitle: '', percent: Math.round((statusCounts['Installed'] / totalComponents) * 100) },
      { title: 'Rejected', subtitle: '', percent: Math.round((statusCounts['Rejected'] / totalComponents) * 100) },
    ];
  };

  const handleRowClick = (project) => {
    setSelectedProject(project);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <WeeklyStats 
            stats={selectedProject ? calculateProjectStats(selectedProject) : []} 
            projectName={selectedProject ? selectedProject.name : 'All Projects'}
          />
        </Grid>
        <Grid item xs={12} lg={8}>
          <TopPerformers onRowClick={handleRowClick} />
        </Grid>
      </Grid>
      <Welcome />
    </Box>
  );
};

export default Modern;
