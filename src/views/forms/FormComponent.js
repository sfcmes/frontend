import React, { useState } from 'react';
import { Grid, Tab, Box } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import PageContainer from '../../components/container/PageContainer';
import FVComponent from '../../components/forms/form-validation/FVComponent';
import ExcelUploadForm from '../../components/forms/form-validation/ExcelUploadForm';
import OtherComponentManager from '../../components/forms/form-validation/OtherComponentManager';
import PrecastComponentManager from '../../components/forms/form-validation/PrecastComponentManager';

const FormComponent = () => {
  const [value, setValue] = useState('1');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <PageContainer title="จัดการชิ้นงานของแต่ละโครงการ" description="Manage components individually or in bulk">
      <div className="mes-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: '17px', color: 'var(--ink)' }}>
          จัดการชิ้นงานของแต่ละโครงการ
        </div>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label="component management tabs">
              <Tab label="เพิ่มชิ้นงานเข้าระบบรายชิ้น" value="1" />
              <Tab label="เพิ่มชิ้นงานเข้าระบบด้วย Excel" value="2" />
              <Tab label="จัดการชิ้นงานอื่นๆ" value="3" />
              <Tab label="จัดการชิ้นงานพรีคาสท์" value="4" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <Grid container spacing={3}>
              <Grid item xs={8}>
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
          <TabPanel value="3">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <OtherComponentManager />
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value="4">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <PrecastComponentManager />
              </Grid>
            </Grid>
          </TabPanel>
        </TabContext>
      </div>
    </PageContainer>
  );
};

export default FormComponent;
