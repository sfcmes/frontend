import { Grid, InputAdornment, Button } from '@mui/material';
import React from 'react';
import CustomFormLabel from '../theme-elements/CustomFormLabel';
import CustomTextField from '../theme-elements/CustomTextField';
import CustomOutlinedInput from '../theme-elements/CustomOutlinedInput';

const BasicLayout = () => {
  return (
    <div>
      {/* ------------------------------------------------------------------------------------------------ */}
      {/* Basic Layout */}
      {/* ------------------------------------------------------------------------------------------------ */}
      <Grid container>
        {/* 1 */}
        <Grid item xs={12} display="flex" alignItems="center">
          <CustomFormLabel htmlFor="bl-name" sx={{ mt: 0 }}>
            ชื่อโครงการ
          </CustomFormLabel>
        </Grid>
        <Grid item xs={12}>
          <CustomTextField id="bl-name" placeholder="Skyrise (Tower D)" fullWidth />
        </Grid>
        {/* 2 */}
        <Grid item xs={12} display="flex" alignItems="center">
          <CustomFormLabel htmlFor="bl-company">
            รหัส
          </CustomFormLabel>
        </Grid>
        <Grid item xs={12}>
          <CustomTextField id="bl-company" placeholder="SKD" fullWidth />
        </Grid>
        {/* 3 */}
        <Grid item xs={12} display="flex" alignItems="center">
          <CustomFormLabel htmlFor="bl-email">
            สถานะโครงการ
          </CustomFormLabel>
        </Grid>
        <Grid item xs={12}>
          <CustomTextField id="bl-company" placeholder="SKD" fullWidth />
        </Grid>
        {/* 4 */}
        <Grid item xs={12} display="flex" alignItems="center">
          <CustomFormLabel htmlFor="bl-phone">
            จำนวนชั้น
          </CustomFormLabel>
        </Grid>
        <Grid item xs={12}>
          <CustomTextField id="bl-phone" placeholder="10" fullWidth />
        </Grid>
        {/* 5 */}
        <Grid item xs={12} display="flex" alignItems="center">
          <CustomFormLabel htmlFor="bl-message">
            Message
          </CustomFormLabel>
        </Grid>
        <Grid item xs={12}>
          <CustomTextField
            id="bl-message"
            placeholder="Hi, Do you  have a moment to talk Jeo ?"
            multiline
            fullWidth
          />
        </Grid>
        <Grid item xs={12} mt={3}>
            <Button variant="contained" color="primary">Send</Button>
        </Grid>
      </Grid>
    </div>
  );
};

export default BasicLayout;
