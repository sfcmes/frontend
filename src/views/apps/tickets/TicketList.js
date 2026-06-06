import React from 'react';
import { Box, Button } from '@mui/material';
import Breadcrumb from '../../../layouts/full/shared/breadcrumb/Breadcrumb';
import PageContainer from '../../../components/container/PageContainer';
import TicketListing from '../../../components/apps/tickets/TicketListing';
import TicketFilter from '../../../components/apps/tickets/TicketFilter';
import ChildCard from 'src/components/shared/ChildCard';
import ResponsiveDialog from 'src/components/material-ui/dialog/ResponsiveDialog';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Tickets',
  },
];

const TicketList = () => {
  return (
    <PageContainer title="Tickets App" description="This is the tickets page.">
      <Breadcrumb title="Tickets app" items={BCrumb} />
      <ChildCard>
        <TicketFilter />
        <TicketListing />
      </ChildCard>
      <Box sx={{ mt: 4 }}>
        <ResponsiveDialog />
      </Box>
    </PageContainer>
  );
};

export default TicketList;
