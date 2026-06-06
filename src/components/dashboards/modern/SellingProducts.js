import React from 'react';
import { Box, CardContent, Chip, Paper, Stack, Typography, LinearProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SavingsImg from '../../../assets/images/backgrounds/piggy.jpg';

const componentData = [
  {
    status: 'Complete',
    count: '2,356',
    percent: 90,
    color: 'primary',
  },
  {
    status: 'Reject',
    count: '256',
    percent: 10,
    color: 'secondary',
  },
];

const ComponentStatus = () => {
  const theme = useTheme();
  const secondarylight = theme.palette.secondary.light;
  const primarylight = theme.palette.primary.light;
  const secondary = theme.palette.secondary.main;
  const primary = theme.palette.primary.main;
  const borderColor = theme.palette.grey[100];

  return (
    <Paper sx={{ bgcolor: 'primary.main', border: `1px solid ${borderColor}` }} variant="outlined">
      <CardContent>
        <Typography variant="h5" color="white">
          Component Status
        </Typography>
        <Typography variant="subtitle1" color="white" mb={4}>
          Overview
        </Typography>

        <Box textAlign="center" mt={2} mb="-90px">
          <img src={SavingsImg} alt={SavingsImg} width={'300px'} />
        </Box>
      </CardContent>
      <Paper sx={{ overflow: 'hidden', zIndex: '1', position: 'relative', margin: '10px' }}>
        <Box p={3}>
          <Stack spacing={3}>
            {componentData.map((data, i) => (
              <Box key={i}>
                <Stack
                  direction="row"
                  spacing={2}
                  mb={1}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="h6">{data.status}</Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                      {data.count}
                    </Typography>
                  </Box>
                  <Chip
                    sx={{
                      backgroundColor: data.color === 'primary' ? primarylight : secondarylight,
                      color: data.color === 'primary' ? primary : secondary,
                      borderRadius: '4px',
                      width: 55,
                      height: 24,
                    }}
                    label={data.percent + '%'}
                  />
                </Stack>
                <LinearProgress value={data.percent} variant="determinate" color={data.color} />
              </Box>
            ))}
          </Stack>
        </Box>
      </Paper>
    </Paper>
  );
};

export default ComponentStatus;