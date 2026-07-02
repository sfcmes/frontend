// [MES] Register — user registration page (dark). Registration flow unchanged.
import { Link } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import { SfcMark, BrandWord } from 'src/layouts/mes/Logo';
import AuthRegister from '../authForms/AuthRegister';

const Register = () => (
  <PageContainer title="Register" description="this is Register page">
    <div className="min-h-dvh bg-mes-bg px-3 py-6 md:px-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-4 flex items-center justify-center gap-3">
          <SfcMark size={34} />
          <BrandWord />
        </div>
        <div className="mes-card p-4 md:p-6">
          <AuthRegister />
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <span className="text-mes-muted">ลงทะเบียนแล้ว?</span>
            <Link to="/auth/login" className="font-semibold text-mes-accent">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </div>
    </div>
  </PageContainer>
);

export default Register;
