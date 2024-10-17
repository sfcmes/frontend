import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import TopCards from '../../components/dashboards/modern/TopCards';
import TopPerformers from '../../components/dashboards/modern/TopPerformers';
import WeeklyStats from '../../components/dashboards/modern/WeeklyStats';
import Welcome from '../../layouts/full/shared/welcome/Welcome';
import { fetchProjects, fetchUserProfile, fetchUserProjects } from 'src/utils/api';
import videoBg from 'src/assets/videos/blue-sky-background-4k.mp4';

const statusDisplayMap = {
  planning: 'วางแผนผลิต',
  manufactured: 'ผลิตแล้ว',
  in_transit: 'อยู่ระหว่างขนส่ง',
  transported: 'ขนส่งสำเร็จ',
  accepted: 'ตรวจรับแล้ว',
  installed: 'ติดตั้งแล้ว',
  rejected: 'ถูกปฏิเสธ',
};

const Modern = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState([]);
  const [currentTab, setCurrentTab] = useState('1');
  const [userRole, setUserRole] = useState(null);
  const [showTopCards, setShowTopCards] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const videoRef = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userProjects, setUserProjects] = useState([]);

  const handleComponentUpdate = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsResponse, userProfile] = await Promise.all([
          fetchProjects(),
          fetchUserProfile().catch(() => null),
        ]);

        if (projectsResponse && Array.isArray(projectsResponse.data)) {
          const processedProjects = projectsResponse.data.map((project) => ({
            ...project,
            sections: parseInt(project.sections, 10) || 0,
            components: parseInt(project.components, 10) || 0,
          }));
          setProjects(processedProjects);
        } else {
          console.error('Unexpected projects data structure:', projectsResponse);
        }

        setUserRole(userProfile ? userProfile.role : null);

        // Fetch user projects if role is Site User
        if (userProfile && userProfile.role === 'Site User') {
          const userProjectsData = await fetchUserProjects(userProfile.id);
          setUserProjects(userProjectsData.map((p) => p.id));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();

    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
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
      planning: 0,
      manufactured: 0,
      in_transit: 0,
      transported: 0,
      accepted: 0,
      installed: 0,
      rejected: 0,
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

  const handleProjectSelect = useCallback((project) => {
    setSelectedProject(project);
    setProjectStats(calculateProjectStats(project));
    setRefreshTrigger((prev) => prev + 1); // Force re-render
  }, []);

  const handleTabChange = useCallback((newTab) => {
    setCurrentTab(newTab);
    setShowTopCards(newTab === '1');
    setSelectedProject(null);
    setProjectStats([]);
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        minHeight: '100vh',
        padding: theme.spacing(2),
      }}
    >
      {isDesktop && (
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          loop
          muted
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            zIndex: -1,
            objectFit: 'cover',
          }}
        >
          <source src={videoBg} type="video/mp4" />
          Your browser does not support the video tag.
        </Box>
      )}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(10px)',
          backgroundColor: `rgba(${theme.palette.background.default.replace(
            /^\w+\((\d+,\s*\d+,\s*\d+).*$/,
            '$1',
          )}, 0.3)`,
          borderRadius: theme.shape.borderRadius,
          padding: theme.spacing(3),
        }}
      >
        <Grid container spacing={3}>
          {showTopCards && (
            <Grid item xs={12} sx={{ position: 'sticky', top: theme.spacing(2), zIndex: 2 }}>
              <TopCards
                key={`topcards-${refreshTrigger}-${selectedProject?.id || 'no-project'}`}
                stats={projectStats}
                projectName={selectedProject ? selectedProject.name : 'Not Selected'}
                isResetState={currentTab === '2'}
              />
            </Grid>
          )}
          <Grid item xs={12} lg={8}>
            <TopPerformers
              projects={projects}
              onProjectSelect={handleProjectSelect}
              userRole={userRole}
              refreshTrigger={refreshTrigger}
              onTabChange={handleTabChange}
              userProjects={userProjects}
            />
          </Grid>
          <Grid item xs={12} lg={4}>
            <WeeklyStats
              key={`weeklystats-${refreshTrigger}-${selectedProject?.id || 'no-project'}-${currentTab}`}
              projectId={selectedProject ? selectedProject.id : null}
              projectName={selectedProject ? selectedProject.name : 'All Projects'}
              userRole={userRole}
              currentTab={currentTab}
            />
          </Grid>
        </Grid>
        {!isMobile && <Welcome />}
      </Box>
    </Box>
  );
};

export default Modern;
