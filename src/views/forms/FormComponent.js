import React, { useState } from 'react';
import { Grid, Tab, Box } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

// common components
import PageContainer from '../../components/container/PageContainer';
import Breadcrumb from '../../layouts/full/shared/breadcrumb/Breadcrumb';
import ParentCard from '../../components/shared/ParentCard';

// custom components
import FVComponent from '../../components/forms/form-validation/FVComponent';
import ExcelUploadForm from '../../components/forms/form-validation/ExcelUploadForm'; // Updated import path

const BCrumb = [
  { to: '/', title: 'Home' },
  { title: 'จัดการชิ้นงาน' },
];

const FormComponent = () => {
  const [value, setValue] = useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <PageContainer title="จัดการชิ้นงานของแต่ละโครงการ" description="Manage components individually or in bulk">
      <Breadcrumb title="จัดการชิ้นงานของแต่ละโครงการ" items={BCrumb} />
      <ParentCard title="จัดการชิ้นงานของแต่ละโครงการ">
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label="component management tabs">
              <Tab label="เพิ่มชิ้นงานเข้าระบบรายชิ้น" value="1" />
              <Tab label="เพิ่มชิ้นงานเข้าระบบด้วย Excel" value="2" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FVComponent />
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value="2">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ExcelUploadForm />
              </Grid>
            </Grid>
          </TabPanel>
        </TabContext>
      </ParentCard>
    </PageContainer>
  );
};

export default FormComponent;
FormComponent.js


