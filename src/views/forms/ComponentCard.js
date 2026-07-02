// [MES] ComponentCard — QR-landing action card: status, files, accept/reject,
// status history. Status advance/reject logic identical to previous implementation.
// Labels now come from the canonical status-meta (fixes the transported label
// conflict — CONTEXT.md decision 2026-07-02).
import { useEffect, useState } from 'react';
import { fetchProjectDetailsByComponentId } from 'src/utils/api';
import { Icon } from 'src/components/mes/Icon';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { COMPONENT_STATUS, resolveComponentStatus } from 'src/components/mes/status-meta';
import { Timeline } from 'src/components/mes/charts';
import { ConfirmDialog, useToast } from 'src/components/mes/ui';

const statusOrder = ['planning', 'manufactured', 'transported', 'accepted', 'installed'];

const ComponentCard = ({ component, onOpenFile, onStatusChange, disableActions, isAdmin }) => {
  const [statusHistory, setStatusHistory] = useState([]);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const { showToast, toastNode } = useToast();

  useEffect(() => {
    const loadComponentData = async () => {
      try {
        const details = await fetchProjectDetailsByComponentId(component.id);
        setStatusHistory(details.statusHistory || []);
      } catch {
        setStatusHistory([]);
      }
    };
    loadComponentData();
  }, [component.id]);

  const getNextStatus = (currentStatus) => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1];
    }
    return null;
  };

  const handleAccept = async () => {
    if (disableActions) return;
    let newStatus;
    if (isAdmin) {
      newStatus = getNextStatus(component.status);
    } else if (component.status === 'transported') {
      newStatus = 'accepted';
    }
    if (newStatus) {
      await onStatusChange(newStatus);
      showToast('อัพเดทสถานะชิ้นงานเรียบร้อยแล้ว!');
    }
  };

  const handleRejectConfirm = async () => {
    setOpenRejectDialog(false);
    if (disableActions) return;
    await onStatusChange('rejected');
  };

  const canAccept = isAdmin || component.status === 'transported';
  const nextStatus = getNextStatus(component.status);

  return (
    <div className="mes-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mes-accent text-lg font-bold text-mes-accent-ink">
          {component.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-bold">{component.name}</div>
          <div className="truncate font-mono text-xs text-mes-muted">รหัสชิ้นงาน: {component.id}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <StatusBadge status={component.status} />
        <span className="inline-flex items-center gap-1.5 text-xs text-mes-muted">
          <Icon name="calendar" size={13} />
          อัพเดทล่าสุด: {new Date(component.updated_at).toLocaleDateString('th-TH')}
        </span>
      </div>

      {component.description && (
        <p className="mt-3 text-sm text-mes-muted">{component.description}</p>
      )}

      <div className="mt-3 flex items-center gap-2 text-sm text-mes-muted">
        <Icon name="file-text" size={16} />
        {component.files ? component.files.length : 0} ไฟล์แบบ
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {canAccept && (isAdmin ? nextStatus : true) && (
          <button
            className="mes-btn mes-btn-primary w-full"
            onClick={handleAccept}
            disabled={disableActions || component.status === 'installed'}
          >
            <Icon name="circle-check" size={16} />
            {isAdmin ? `อัพเดทเป็น ${COMPONENT_STATUS[nextStatus]?.th || nextStatus}` : 'ยอมรับชิ้นงาน'}
          </button>
        )}
        <button
          className="mes-btn mes-btn-danger w-full"
          onClick={() => setOpenRejectDialog(true)}
          disabled={component.status === 'rejected' || disableActions}
        >
          <Icon name="circle-x" size={16} /> ปฏิเสธชิ้นงาน
        </button>
        <button
          className="mes-btn mes-btn-ghost w-full"
          onClick={() => {
            const fileUrl =
              component.files && component.files.length > 0 ? component.files[0].s3_url : null;
            if (fileUrl) {
              onOpenFile(fileUrl);
            }
          }}
          disabled={!component.files || component.files.length === 0}
        >
          <Icon name="file-text" size={16} /> เปิดไฟล์แบบล่าสุด
        </button>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold">ประวัติการเปลี่ยนแปลงสถานะ</div>
        <div className="mt-2">
          {statusHistory && statusHistory.length > 0 ? (
            <Timeline
              items={statusHistory.map((entry, i) => {
                const m = resolveComponentStatus(entry.status);
                return {
                  meta: m,
                  title: m.th,
                  sub: new Date(entry.timestamp).toLocaleDateString('th-TH'),
                  current: i === 0,
                };
              })}
            />
          ) : (
            <div className="text-sm text-mes-muted">ไม่มีประวัติการเปลี่ยนแปลงสถานะ</div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={openRejectDialog}
        onClose={() => setOpenRejectDialog(false)}
        onConfirm={handleRejectConfirm}
        title="ยืนยันการปฏิเสธ"
        message='คุณแน่ใจว่าต้องการปฏิเสธชิ้นงานนี้หรือไม่? การดำเนินการนี้จะเปลี่ยนสถานะเป็น "ปฏิเสธ"'
        confirmLabel="ยืนยัน"
        danger
      />
      {toastNode}
    </div>
  );
};

export default ComponentCard;
