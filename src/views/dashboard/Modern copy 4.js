import React, { useState } from 'react';
import { Box, Grid } from '@mui/material';
import WeeklyStats from '../../components/dashboards/modern/WeeklyStats';
import TopPerformers from '../../components/dashboards/modern/TopPerformers';
import Welcome from '../../layouts/full/shared/welcome/Welcome';
import Breadcrumb from '../../layouts/full/shared/breadcrumb/Breadcrumb';
import PageContainer from '../../components/container/PageContainer';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Dashboard',
  },
];

const Modern = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  const calculateProjectStats = (project) => {
    const totalComponents = project.sections.reduce((acc, section) => acc + section.components.length, 0);
    const statusCounts = {
      'ผลิตแล้ว': 0,
      'อยู่ระหว่างขนส่ง': 0,
      'ขนส่งสำเร็จ': 0,
      'ติดตั้งแล้ว': 0,
      'Rejected': 0,
    };

    project.sections.forEach((section) => {
      section.components.forEach((component) => {
        statusCounts[component.status]++;
      });
    });

    return [
      { title: 'ผลิตแล้ว', subtitle: '', percent: Math.round((statusCounts['ผลิตแล้ว'] / totalComponents) * 100) },
      { title: 'อยู่ระหว่างขนส่ง', subtitle: '', percent: Math.round((statusCounts['อยู่ระหว่างขนส่ง'] / totalComponents) * 100) },
      { title: 'ขนส่งสำเร็จ', subtitle: '', percent: Math.round((statusCounts['ขนส่งสำเร็จ'] / totalComponents) * 100) },
      { title: 'ติดตั้งแล้ว', subtitle: '', percent: Math.round((statusCounts['ติดตั้งแล้ว'] / totalComponents) * 100) },
      { title: 'Rejected', subtitle: '', percent: Math.round((statusCounts['Rejected'] / totalComponents) * 100) },
    ];
  };

  const handleRowClick = (project) => {
    setSelectedProject(project);
  };

  return (
    <PageContainer title="Dashboard" description="Overview of project status">
      {/* breadcrumb */}
      <Breadcrumb title="Dashboard" items={BCrumb} />
      {/* end breadcrumb */}
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <WeeklyStats
              stats={selectedProject ? calculateProjectStats(selectedProject) : []}
              projectName={selectedProject ? selectedProject.name : 'All Projects'}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={8}>
            <TopPerformers onRowClick={handleRowClick} />
          </Grid>
        </Grid>
        <Box mt={3}>
          <Welcome />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Modern;
