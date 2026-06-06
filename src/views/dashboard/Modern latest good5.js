import React, { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import TopCards from '../../components/dashboards/modern/TopCards';
import TopPerformers from '../../components/dashboards/modern/TopPerformers';
import WeeklyStats from '../../components/dashboards/modern/WeeklyStats';
import Welcome from '../../layouts/full/shared/welcome/Welcome';
import { fetchProjects } from 'src/utils/api';

const statusDisplayMap = {
  'Manufactured': 'ผลิตแล้ว',
  'In Transit': 'อยู่ระหว่างขนส่ง',
  'Transported': 'ขนส่งสำเร็จ',
  'Accepted': 'ตรวจรับแล้ว',
  'Installed': 'ติดตั้งแล้ว',
  'Rejected': 'ถูกปฏิเสธ'
};

const Modern = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchProjects();
        if (response && response.data && Array.isArray(response.data.projects)) {
          setProjects(response.data.projects);
        } else {
          console.error('Unexpected projects data structure:', response);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const stats = calculateProjectStats(selectedProject);
      setProjectStats(stats);
    }
  }, [selectedProject]);

  const calculateProjectStats = (project) => {
    const totalComponents = project.sections.reduce((acc, section) => acc + section.components.length, 0);
    const statusCounts = {
      'Manufactured': 0,
      'In Transit': 0,
      'Transported': 0,
      'Accepted': 0,
      'Installed': 0,
      'Rejected': 0
    };
  
    project.sections.forEach((section) => {
      section.components.forEach((component) => {
        if (statusCounts.hasOwnProperty(component.status)) {
          statusCounts[component.status]++;
        }
      });
    });
  
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status,
      displayTitle: statusDisplayMap[status] || status,
      subtitle: '',
      percent: totalComponents > 0 ? Number(((count / totalComponents) * 100).toFixed(2)) : 0,
      count: count
    }));
  };

  const handleRowClick = (project) => {
    setSelectedProject(project);
  };

  return (
    <Box >
      <Grid container spacing={3}>
        <Grid item sm={12} lg={12}>
          <TopCards stats={projectStats} />
        </Grid>
        <Grid item xs={12} lg={8}>
          <TopPerformers projects={projects} onRowClick={handleRowClick} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <WeeklyStats
            projectName={selectedProject ? selectedProject.name : 'All Projects'}
          />
        </Grid>
      </Grid>
        <Welcome />
    </Box>
  );
};

export default Modern;