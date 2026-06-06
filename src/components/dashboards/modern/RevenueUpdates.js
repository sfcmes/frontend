import React from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import { MenuItem, Grid, Stack, Typography, Button, Avatar, Box } from '@mui/material';
import { IconGridDots } from '@tabler/icons';
import DashboardCard from '../../shared/DashboardCard';
import CustomSelect from '../../forms/theme-elements/CustomSelect';

const ComponentProgressChart = () => {
  const [month, setMonth] = React.useState('1');

  const handleChange = (event) => {
    setMonth(event.target.value);
  };

  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  // mock data for the chart
  const optionscolumnchart = {
    // ... (keep the existing chart options)
    xaxis: {
      categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      axisBorder: {
        show: false,
      },
    },
    // ... (keep the existing chart options)
  };
  const seriescolumnchart = [
    {
      name: 'Produced Components',
      data: [50, 80, 120, 100],
    },
    {
      name: 'Installed Components',
      data: [30, 60, 90, 110],
    },
  ];

  // mock data for the summary
  const totalComponents = 500;
  const producedComponents = 350;
  const installedComponents = 290;

  return (
    <DashboardCard
      title="Component Progress"
      subtitle="Overview of Component Production and Installation"
      action={
        <CustomSelect
          labelId="month-dd"
          id="month-dd"
          value={month}
          size="small"
          onChange={handleChange}
        >
          <MenuItem value={1}>June 2023</MenuItem>
          <MenuItem value={2}>July 2023</MenuItem>
          <MenuItem value={3}>August 2023</MenuItem>
        </CustomSelect>
      }
    >
      <Grid container spacing={3}>
        {/* column */}
        <Grid item xs={12} sm={8}>
          <Box className="rounded-bars">
            <Chart
              options={optionscolumnchart}
              series={seriescolumnchart}
              type="bar"
              height="370px"
            />
          </Box>
        </Grid>
        {/* column */}
        <Grid item xs={12} sm={4}>
          <Stack spacing={3} mt={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                width={40}
                height={40}
                bgcolor="primary.light"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Typography color="primary" variant="h6" display="flex">
                  <IconGridDots width={21} />
                </Typography>
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="700">
                  {totalComponents}
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Components
                </Typography>
              </Box>
            </Stack>
          </Stack>
          <Stack spacing={3} my={5}>
            <Stack direction="row" spacing={2}>
              <Avatar
                sx={{ width: 9, mt: 1, height: 9, bgcolor: primary, svg: { display: 'none' } }}
              ></Avatar>
              <Box>
                <Typography variant="subtitle1" color="textSecondary">
                  Produced Components
                </Typography>
                <Typography variant="h5">{producedComponents}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Avatar
                sx={{ width: 9, mt: 1, height: 9, bgcolor: secondary, svg: { display: 'none' } }}
              ></Avatar>
              <Box>
                <Typography variant="subtitle1" color="textSecondary">
                  Installed Components
                </Typography>
                <Typography variant="h5">{installedComponents}</Typography>
              </Box>
            </Stack>
          </Stack>
          <Button color="primary" variant="contained" fullWidth>
            View Full Report
          </Button>
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default ComponentProgressChart;