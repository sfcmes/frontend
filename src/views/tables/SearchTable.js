import * as React from 'react';

import { Box } from '@mui/material';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import PageContainer from 'src/components/container/PageContainer';
import ProductTableList from 'src/components/apps/ecommerce/ProductTableList/ProductTableList';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'ตารางแสดงสถานะโครงการ',
  },
];

const SearchTable = () => {
  return (
    <PageContainer title="ตารางแสดงสถานะโครงการ" description="this is Search Table page">
      {/* breadcrumb */}
      <Breadcrumb title="ตารางแสดงสถานะโครงการ" items={BCrumb} />
      {/* end breadcrumb */}
      <Box>
        <ProductTableList />
      </Box>
    </PageContainer>
  );
};

export default SearchTable;
