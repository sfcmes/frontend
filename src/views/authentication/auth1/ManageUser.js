// [MES] ManageUser — user administration page wrapper.
import PageContainer from 'src/components/container/PageContainer';
import { CardHeader } from 'src/components/mes/ui';
import UserList from './UserList';

const ManageUser = () => {
  return (
    <PageContainer title="Manage Users" description="Manage user roles and projects">
      <div className="min-h-dvh bg-mes-bg px-3 py-4 md:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mes-card">
            <CardHeader title="จัดการผู้ใช้งาน" />
            <UserList />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ManageUser;
