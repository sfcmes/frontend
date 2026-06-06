import React from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

import DashboardWidgetCard from '../../shared/DashboardWidgetCard';

const ProductionMetrics = () => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primarylight = theme.palette.grey[100];

  // mock data for the chart
  const optionscolumnchart = {
    // ... (keep the existing chart options)
    xaxis: {
      categories: [['Week 1'], ['Week 2'], ['Week 3'], ['Week 4']],
      axisBorder: {
        show: false,
      },
    },
    // ... (keep the existing chart options)
  };
  const seriescolumnchart = [
    {
      name: '',
      data: [100, 120, 90, 110],
    },
  ];

  // mock data for the metrics
  const totalProduction = 420;
  const targetProduction = 500;

  return (
    <DashboardWidgetCard
      title="Production Metrics"
      subtitle="Weekly"
      dataLabel1="Total Production"
      dataItem1={totalProduction}
      dataLabel2="Target Production"
      dataItem2={targetProduction}
    >
      <>
        <Chart options={optionscolumnchart} series={seriescolumnchart} type="bar" height="280px" />
      </>
    </DashboardWidgetCard>
  );
};

export default ProductionMetrics;