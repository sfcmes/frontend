// [MES] AuthLogin — login form; auth flow identical to previous implementation.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import logo from 'src/assets/images/logos/logo-main.svg';

const AuthLogin = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailOrUsername.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(emailOrUsername, password);
      if (result.success) {
        navigate('/dashboards/modern');
      } else {
        setError(result.error || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <img src={logo} alt="SFC" className="h-auto w-24" />
      <div className="text-center">
        <h1 className="text-lg font-bold tracking-wide">WELCOME TO SFC PC SYSTEM</h1>
        <div className="text-xs text-mes-muted">SFC PRECAST SYSTEM</div>
      </div>

      <div className="w-full">
        <label className="mes-label" htmlFor="login-user">อีเมลหรือชื่อผู้ใช้งาน</label>
        <input
          id="login-user"
          className="mes-input"
          autoComplete="username"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
        />
      </div>
      <div className="w-full">
        <label className="mes-label" htmlFor="login-pass">รหัสผ่าน</label>
        <input
          id="login-pass"
          className="mes-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <div className="w-full text-center text-xs text-sem-danger">{error}</div>}

      <button className="mes-btn mes-btn-primary w-full" type="submit" disabled={isLoading}>
        {isLoading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  );
};

export default AuthLogin;
