// [MES] ForgotPassword — placeholder reset-password page (no backend flow yet,
// matching the previous template stub). Rebuilt dark, Thai-first.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import { SfcMark, BrandWord } from 'src/layouts/mes/Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  return (
    <PageContainer title="Forgot Password" description="this is Forgot Password page">
      <div className="flex min-h-dvh items-center justify-center bg-mes-bg px-3 py-6">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex items-center justify-center gap-3">
            <SfcMark size={34} />
            <BrandWord />
          </div>
          <div className="mes-card p-5">
            <h1 className="text-lg font-bold">ลืมรหัสผ่าน?</h1>
            <p className="mt-1 text-sm text-mes-muted">
              กรุณากรอกอีเมลที่ผูกกับบัญชีของคุณ แล้วติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน
            </p>
            <div className="mt-4">
              <label className="mes-label" htmlFor="fp-email">อีเมล</label>
              <input
                id="fp-email"
                className="mes-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <a
              className="mes-btn mes-btn-primary mt-3 w-full"
              href={`mailto:?subject=ขอรีเซ็ตรหัสผ่าน SFC MES&body=อีเมลบัญชี: ${email}`}
            >
              ติดต่อผู้ดูแลระบบ
            </a>
            <Link to="/auth/login" className="mes-btn mes-btn-ghost mt-2 w-full">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ForgotPassword;
