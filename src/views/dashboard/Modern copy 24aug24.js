import React, { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import TopCards from '../../components/dashboards/modern/TopCards';
import WeeklyStats from '../../components/dashboards/modern/WeeklyStats';
import TopPerformers from '../../components/dashboards/modern/TopPerformers';
import Welcome from '../../layouts/full/shared/welcome/Welcome';
import { fetchProjects } from 'src/utils/api';
import videoBg from 'src/assets/videos/blue-sky-background-4k.mp4'; // Import your video

const statusDisplayMap = {
  Planning: 'วางแผนผลิต',
  Manufactured: 'ผลิตแล้ว',
  'In Transit': 'อยู่ระหว่างขนส่ง',
  Transported: 'ขนส่งสำเร็จ',
  Accepted: 'ตรวจรับแล้ว',
  Installed: 'ติดตั้งแล้ว',
  Rejected: 'ถูกปฏิเสธ',
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
    } else {
      setProjectStats([]);
    }
  }, [selectedProject]);

  const calculateProjectStats = (project) => {
    if (!project || !project.sections) {
      return [];
    }

    const totalComponents = project.sections.reduce(
      (acc, section) => acc + (section.components ? section.components.length : 0),
      0,
    );
    const statusCounts = {
      Planning: 0,
      Manufactured: 0,
      'In Transit': 0,
      Transported: 0,
      Accepted: 0,
      Installed: 0,
      Rejected: 0,
    };

    project.sections.forEach((section) => {
      if (section.components) {
        section.components.forEach((component) => {
          if (statusCounts.hasOwnProperty(component.status)) {
            statusCounts[component.status]++;
          }
        });
      }
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status,
      displayTitle: statusDisplayMap[status] || status,
      subtitle: '',
      percent: totalComponents > 0 ? Number(((count / totalComponents) * 100).toFixed(2)) : 0,
      count: count,
    }));
  };

  const handleRowClick = (project) => {
    setSelectedProject(project);
  };

  return (
    <Box position="relative" overflow="hidden" width="100%" height="100vh">
      <video
        autoPlay
        loop
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1,
        }}
      >
        <source src={videoBg} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Grid container spacing={3}>
          <Grid item sm={12} lg={12}>
            <TopCards
              stats={projectStats}
              projectName={selectedProject ? selectedProject.name : 'Not Selected'}
            />
          </Grid>
          <Grid item xs={12} lg={8}>
            <TopPerformers projects={projects} onRowClick={handleRowClick} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <WeeklyStats
              projectId={selectedProject ? selectedProject.id : null}
              projectName={selectedProject ? selectedProject.name : 'All Projects'}
            />
          </Grid>
        </Grid>
        <Welcome />
      </Box>
    </Box>
  );
};

export default Modern;
