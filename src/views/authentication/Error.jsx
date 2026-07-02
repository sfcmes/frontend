// [MES] Error — 404 page.
import { Link } from 'react-router-dom';
import ErrorImg from 'src/assets/images/backgrounds/errorimg.svg';

const Error = () => (
  <div className="flex min-h-dvh flex-col items-center justify-center bg-mes-bg px-4 text-center">
    <img src={ErrorImg} alt="404" className="h-auto w-full max-w-md" />
    <h1 className="mt-4 text-2xl font-bold">ไม่พบหน้าที่ต้องการ</h1>
    <p className="mt-2 text-sm text-mes-muted">หน้าที่คุณกำลังค้นหาไม่มีอยู่ หรือถูกย้ายไปแล้ว</p>
    <Link to="/dashboards/modern" className="mes-btn mes-btn-primary mt-5">
      กลับหน้าหลัก
    </Link>
  </div>
);

export default Error;
