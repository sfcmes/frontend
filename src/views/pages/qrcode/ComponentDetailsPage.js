// [MES] ComponentDetailsPage — public component detail + status update (/component/:id).
// The previous free-typed status list ('ส่งชิ้นงานแล้ว', 'Accept', …) is replaced by
// the canonical workflow statuses (CONTEXT.md decision 2026-07-02). UI rebuilt Thai-first.
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchComponentById, updateComponentStatus } from 'src/utils/api';
import { Icon } from 'src/components/mes/Icon';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { COMPONENT_STATUS, PIPE_ORDER } from 'src/components/mes/status-meta';
import { ConfirmDialog, Spinner, useToast } from 'src/components/mes/ui';

const ComponentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const { showToast, toastNode } = useToast();

  const loadComponentDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchComponentById(id);
      setComponent(data);
      setNewStatus(data.status);
    } catch {
      setError('ไม่สามารถโหลดข้อมูลชิ้นงานได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadComponentDetails();
  }, [loadComponentDetails]);

  const handleConfirmStatusUpdate = async () => {
    setOpenConfirmDialog(false);
    try {
      await updateComponentStatus(id, newStatus);
      await loadComponentDetails();
      showToast('อัปเดตสถานะสำเร็จ');
    } catch {
      showToast('อัปเดตสถานะไม่สำเร็จ', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-mes-bg">
        <Spinner />
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-mes-bg p-4 text-center">
        <span className="text-sem-danger"><Icon name="alert-triangle" size={28} /></span>
        <div className="text-sm">{error || 'ไม่พบข้อมูลชิ้นงาน'}</div>
        {error ? (
          <button className="mes-btn mes-btn-primary" onClick={loadComponentDetails}>ลองอีกครั้ง</button>
        ) : (
          <button className="mes-btn mes-btn-ghost" onClick={() => navigate(-1)}>กลับ</button>
        )}
      </div>
    );
  }

  const prop = (label, value) => (
    <div className="flex justify-between gap-3 border-b border-mes-border py-2 text-sm last:border-0">
      <span className="text-mes-muted">{label}</span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  );

  return (
    <div className="min-h-dvh bg-mes-bg px-3 py-4 md:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <button className="mes-btn mes-btn-ghost mb-3" onClick={() => navigate(-1)}>
          <Icon name="arrow-left" size={16} /> กลับ
        </button>

        <div className="mes-card p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 grow">
              <h1 className="truncate text-lg font-bold">{component.name}</h1>
              <div className="text-xs text-mes-muted">{component.type || 'ชิ้นงานพรีคาสท์'}</div>
            </div>
            <StatusBadge status={component.status} />
          </div>

          <div className="mt-3">
            {prop('โครงการ', component.project?.name)}
            {prop('ชั้น / Section', component.section?.name)}
            {prop('ความกว้าง', component.width ? `${component.width} มม.` : null)}
            {prop('ความสูง', component.height ? `${component.height} มม.` : null)}
          </div>

          <div className="mt-4 text-xs font-semibold text-mes-muted">อัปเดตสถานะ</div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <select
              className="mes-input sm:max-w-xs"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {PIPE_ORDER.map((k) => (
                <option key={k} value={k}>{COMPONENT_STATUS[k].th}</option>
              ))}
            </select>
            <button
              className="mes-btn mes-btn-primary"
              onClick={() => setOpenConfirmDialog(true)}
              disabled={!newStatus || newStatus === component.status}
            >
              <Icon name="circle-check" size={15} /> อัปเดตสถานะ
            </button>
          </div>

          <div className="mt-5 text-xs font-semibold text-mes-muted">ไฟล์</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {component.files && component.files.length > 0 ? (
              component.files.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-touch items-center gap-2 rounded-sm border border-mes-border px-3 py-2 text-sm text-mes-accent hover:bg-mes-surface-2"
                >
                  <Icon name="file-text" size={16} />
                  <span className="min-w-0 grow truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-mes-muted">{file.type || '—'}</span>
                </a>
              ))
            ) : (
              <div className="text-sm text-mes-muted">ยังไม่มีไฟล์</div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={openConfirmDialog}
        onClose={() => { setOpenConfirmDialog(false); setNewStatus(component.status); }}
        onConfirm={handleConfirmStatusUpdate}
        title="ยืนยันการเปลี่ยนสถานะ"
        message={`คุณแน่ใจว่าต้องการเปลี่ยนสถานะเป็น "${COMPONENT_STATUS[newStatus]?.th || newStatus}" หรือไม่?`}
        confirmLabel="ยืนยัน"
      />
      {toastNode}
    </div>
  );
};

export default ComponentDetailsPage;
