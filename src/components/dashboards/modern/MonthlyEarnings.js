import React from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import { Stack, Typography, Avatar, Fab } from '@mui/material';
import { IconArrowUpRight, IconTrendingUp } from '@tabler/icons';

import DashboardCard from '../../shared/DashboardCard';

const MonthlyProductionProgress = () => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primarylight = theme.palette.primary.light;
  const successlight = theme.palette.success.light;

  // mock data for the chart
  const optionscolumnchart = {
    // ... (keep the existing chart options)
    fill: {
      colors: [primarylight],
      type: 'solid',
      opacity: 0.05,
    },
    // ... (keep the existing chart options)
  };
  const seriescolumnchart = [
    {
      name: '',
      color: primary,
      data: [50, 80, 60, 90, 70, 100, 80],
    },
  ];

  // mock data for the summary
  const monthlyProduction = 120;
  const lastMonthProduction = 100;
  const productionGrowth = ((monthlyProduction - lastMonthProduction) / lastMonthProduction) * 100;

  return (
    <DashboardCard
      title="Monthly Production Progress"
      action={
        <Fab color="primary" size="medium">
          <IconTrendingUp width={24} />
        </Fab>
      }
      footer={
        <Chart options={optionscolumnchart} series={seriescolumnchart} type="area" height="60px" />
      }
    >
      <>
        <Typography variant="h3" fontWeight="700" mt="-20px">
          {monthlyProduction}
        </Typography>
        <Stack direction="row" spacing={1} my={1} alignItems="center">
          <Avatar sx={{ bgcolor: successlight, width: 27, height: 27 }}>
            <IconArrowUpRight width={20} color="#39B69A" />
          </Avatar>
          <Typography variant="subtitle2" fontWeight="600">
            +{productionGrowth.toFixed(2)}%
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            from last month
          </Typography>
        </Stack>
      </>
    </DashboardCard>
  );
};

export default MonthlyProductionProgress;