import React from 'react';
import { Box, CardContent, Grid, Typography } from '@mui/material';

// Import your custom icons or use external libraries like Material-UI Icons
import ProjectsIcon from '@mui/icons-material/Business';
import SectionsIcon from '@mui/icons-material/Apartment';
import ComponentsIcon from '@mui/icons-material/Build';
import UsersIcon from '@mui/icons-material/People';

// Mock data based on your database structure
const mockData = {
  projectsCount: 6,
  sectionsCount: 12,
  componentsCount: 150,
  usersCount: 20,
};

const topcards = [
  {
    icon: <ProjectsIcon />,
    title: 'Projects',
    dataKey: 'projectsCount',
    bgcolor: 'primary',
  },
  {
    icon: <SectionsIcon />,
    title: 'Sections',
    dataKey: 'sectionsCount',
    bgcolor: 'warning',
  },
  {
    icon: <ComponentsIcon />,
    title: 'Components',
    dataKey: 'componentsCount',
    bgcolor: 'secondary',
  },
  {
    icon: <UsersIcon />,
    title: 'Users',
    dataKey: 'usersCount',
    bgcolor: 'info',
  },
];

const TopCards = () => {
  return (
    <Grid container spacing={3} mt={3}>
      {topcards.map((topcard, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Box bgcolor={topcard.bgcolor + '.light'} textAlign="center">
            <CardContent>
              <Typography color={topcard.bgcolor + '.main'} variant="h4" fontWeight={600}>
                {mockData[topcard.dataKey]}
              </Typography>
              <Typography
                color={topcard.bgcolor + '.main'}
                mt={1}
                variant="subtitle1"
                fontWeight={600}
              >
                {topcard.title}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default TopCards;