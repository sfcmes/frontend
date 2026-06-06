import React from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import { Stack, Typography, Avatar } from '@mui/material';
import { IconArrowUpRight } from '@tabler/icons';

import DashboardCard from '../../shared/DashboardCard';

const ScrapData = () => {
  // chart color
  const theme = useTheme();
  const secondary = theme.palette.secondary.main;
  const secondarylight = theme.palette.secondary.light;
  const errorlight = theme.palette.error.light;

  // chart
  const optionscolumnchart = {
    chart: {
      type: 'area',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: false,
      },
      height: 80,
      sparkline: {
        enabled: true,
      },
      group: 'sparklines',
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      colors: [secondarylight],
      type: 'solid',
      opacity: 0.05,
    },
    markers: {
      size: 0,
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      x: {
        show: false,
      },
    },
  };
  const seriescolumnchart = [
    {
      name: '',
      color: secondary,
      data: [2.5, 3.2, 2.8, 3.5, 3.0, 2.7],
    },
  ];

  // mock data for the scrap rate and total scrap
  const scrapRate = 3.1;
  const totalScrap = 1250;

  return (
    <DashboardCard
      footer={
        <>
          <Chart
            options={optionscolumnchart}
            series={seriescolumnchart}
            type="area"
            height="80px"
          />
        </>
      }
    >
      <>
        <Typography variant="subtitle2" color="textSecondary">
          Scrap Rate
        </Typography>
        <Typography variant="h4">{scrapRate}%</Typography>
        <Stack direction="row" spacing={1} mt={1} alignItems="center">
          <Avatar sx={{ bgcolor: errorlight, width: 24, height: 24 }}>
            <IconArrowUpRight width={18} color="#FA896B" />
          </Avatar>
          <Typography variant="subtitle2" fontWeight="600">
            Total Scrap: {totalScrap}
          </Typography>
        </Stack>
      </>
    </DashboardCard>
  );
};

export default ScrapData;