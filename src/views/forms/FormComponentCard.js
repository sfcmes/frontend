// [MES] FormComponentCard — public QR-landing page: verify username, then act on
// the component (accept / reject / open drawing). Data logic identical to previous
// implementation.
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchComponentByQR,
  updateComponentStatus,
  fetchComponentFiles,
  openFile,
  checkUsernameAndRole,
} from 'src/utils/api';
import ComponentCard from './ComponentCard';
import { Icon } from 'src/components/mes/Icon';
import { ConfirmDialog, Spinner } from 'src/components/mes/ui';

const FormComponentCard = () => {
  const { id } = useParams();
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);

  const fetchComponentData = useCallback(async () => {
    try {
      setLoading(true);
      const componentData = await fetchComponentByQR(id);
      const filesData = await fetchComponentFiles(id);
      setComponent({ ...componentData, files: filesData });
    } catch {
      setError('ไม่สามารถโหลดข้อมูลชิ้นงานได้');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComponentData();
  }, [fetchComponentData]);

  const handleVerifyUser = async () => {
    if (!username) {
      setUsernameError('กรุณาใส่ชื่อผู้ใช้งาน');
      return;
    }
    try {
      const { isValid, role } = await checkUsernameAndRole(username);
      if (isValid) {
        setIsAdmin(role === 'Admin');
        setIsUserVerified(true);
        setUsernameError('');
      } else {
        setUsernameError('ชื่อผู้ใช้งานไม่ถูกต้อง');
        setIsUserVerified(false);
      }
    } catch {
      setError('ไม่สามารถตรวจสอบชื่อผู้ใช้งานได้');
      setIsUserVerified(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isUserVerified) {
      setUsernameError('กรุณายืนยันชื่อผู้ใช้งานก่อน');
      return;
    }
    setConfirmDialog({ open: true, action: () => updateStatus(newStatus) });
  };

  const updateStatus = async (newStatus) => {
    try {
      await updateComponentStatus(id, newStatus, username);
      await fetchComponentData();
    } catch {
      setError('ไม่สามารถอัพเดทสถานะชิ้นงานได้');
    }
  };

  const handleFileOpen = async (fileUrl) => {
    try {
      await openFile(fileUrl);
    } catch {
      setError('ไม่สามารถเปิดไฟล์ได้');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-mes-bg">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-mes-bg p-4 text-center">
        <span className="text-sem-danger"><Icon name="alert-triangle" size={28} /></span>
        <div className="text-sm">{error}</div>
      </div>
    );
  }
  if (!component) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-mes-bg p-4 text-sm text-mes-muted">
        ไม่พบข้อมูลชิ้นงาน
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-mes-bg px-3 py-4 md:px-6">
      <div className="mx-auto w-full max-w-xl">
        <div className="mes-card p-4">
          <label className="mes-label" htmlFor="fcc-username">ชื่อผู้ใช้งาน</label>
          <div className="flex gap-2">
            <input
              id="fcc-username"
              className="mes-input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError('');
                setIsUserVerified(false);
              }}
            />
            <button className="mes-btn mes-btn-primary shrink-0" onClick={handleVerifyUser} disabled={!username}>
              ตกลง
            </button>
          </div>
          {usernameError && <div className="mt-1 text-xs text-sem-danger">{usernameError}</div>}
          {isUserVerified && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-sem-success">
              <Icon name="circle-check" size={15} />
              ยืนยันตัวตนสำเร็จ {isAdmin ? '(Admin)' : '(ผู้ใช้ทั่วไป)'}
            </div>
          )}
        </div>

        <div className="mt-3">
          <ComponentCard
            component={component}
            onStatusChange={(newStatus) => handleStatusChange(newStatus)}
            onOpenFile={handleFileOpen}
            disableActions={!isUserVerified}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        onConfirm={() => {
          if (confirmDialog.action) confirmDialog.action();
          setConfirmDialog({ open: false, action: null });
        }}
        title="ยืนยันการเปลี่ยนสถานะ"
        message="คุณแน่ใจว่าต้องการเปลี่ยนสถานะของชิ้นงานนี้หรือไม่?"
        confirmLabel="ยืนยัน"
      />
    </div>
  );
};

export default FormComponentCard;
