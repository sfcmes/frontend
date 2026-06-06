import React from 'react';
import { Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import UserTableList from './UserTableList';


const SearchTable = ({ refreshTrigger }) => {
  return (
    <PageContainer title="User Management" description="User management table">
      <Box>
        <UserTableList refreshTrigger={refreshTrigger} />
      </Box>
    </PageContainer>
  );
};


export default SearchTable;