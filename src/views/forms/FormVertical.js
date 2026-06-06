import React from 'react';
import { Grid, Typography } from '@mui/material';

// components
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import PageContainer from 'src/components/container/PageContainer';
import ParentCard from 'src/components/shared/ParentCard';


import BasicLayout from '../../components/forms/form-vertical/BasicLayout';

import BasicIcons from '../../components/forms/form-vertical/BasicIcons';
import FormSeparator from '../../components/forms/form-vertical/FormSeparator';
import CollapsibleForm from '../../components/forms/form-vertical/CollapsibleForm';
import FormTabs from '../../components/forms/form-vertical/FormTabs';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Create New Project',
  },
];

const FormVertical = () => {
  return (
    <PageContainer title="Create New Project" description="this is Vertical Form page">
      {/* breadcrumb */}
      <Breadcrumb title="สร้างโปรเจ็คใหม่" items={BCrumb} />
      {/* end breadcrumb */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <ParentCard title="สร้างโปรเจ็คใหม่">
            <BasicLayout />
          </ParentCard>
        </Grid>
        {/* <Grid item xs={12} lg={6}>
            
          <ParentCard title="Basic with Icons">
            <BasicIcons />
          </ParentCard>

        </Grid> */}
        <Grid item xs={12}>
          <ParentCard title="Multi Column with Form Separator">
            <FormSeparator />
          </ParentCard>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" mb={3}>Collapsible Section</Typography>
          <CollapsibleForm />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" mb={3}>Form with Tabs</Typography>
          <FormTabs />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default FormVertical;
