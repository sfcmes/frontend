// [MES] FormPO — purchase order management: status tabs, list, action dialogs.
// Business logic identical to previous implementation; window.confirm → ConfirmDialog.
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import {
  fetchAllPOs, fetchPOById, createPO, updatePO, deletePO, submitPO,
  confirmPOOrdered, confirmPOReceived,
} from 'src/utils/api';
import { Icon } from 'src/components/mes/Icon';
import { StatusBadge } from 'src/components/mes/StatusBadge';
import { PO_STATUS } from 'src/components/mes/status-meta';
import { ConfirmDialog, EmptyState, Spinner, useToast, CardHeader } from 'src/components/mes/ui';
import FVPurchaseOrder from 'src/components/forms/form-validation/FVPurchaseOrder';
import POOrderedDialog from './po-dialogs/POOrderedDialog';
import POReceivedDialog from './po-dialogs/POReceivedDialog';
import PODetailDialog from './po-dialogs/PODetailDialog';

const TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'submitted', label: PO_STATUS.submitted.th },
  { key: 'ordered', label: PO_STATUS.ordered.th },
  { key: 'received', label: PO_STATUS.received.th },
];

// Map a PO row to FVPurchaseOrder initialValues for editing a draft.
const toFormValues = (po) => ({
  projectId: po.project_id,
  buyerEmail: po.buyer_email,
  requestedDeliveryDate: po.requested_delivery_date
    ? String(po.requested_delivery_date).slice(0, 10) : '',
  notes: po.notes || '',
  items: (po.items || []).map((it) => ({
    materialName: it.material_name, unit: it.unit,
    quantity: it.quantity, notes: it.notes || '',
  })),
});

const dateStr = (d) => (d ? String(d).slice(0, 10) : '-');

const FormPO = () => {
  const { user } = useAuth();
  const isBuyer = user && (user.role === 'buyer' || user.role === 'Admin');
  const [params] = useSearchParams();
  const lockProjectId = params.get('project');
  const highlightId = params.get('highlight');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const { showToast, toastNode } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editPO, setEditPO] = useState(null);
  const [orderedPO, setOrderedPO] = useState(null);
  const [receivedPO, setReceivedPO] = useState(null);
  const [detailPO, setDetailPO] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const editInitialValues = useMemo(() => (editPO ? toFormValues(editPO) : null), [editPO]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllPOs();
      setRows(res.data || []);
    } catch {
      showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  // Auto-open create dialog when arriving with ?project=
  useEffect(() => {
    if (lockProjectId) { setEditPO(null); setFormOpen(true); }
  }, [lockProjectId]);

  const filtered = tab === 'all' ? rows : rows.filter((r) => r.status === tab);

  // ---- form save handlers ----
  const persistDraft = async (values) => {
    if (editPO) {
      await updatePO(editPO.id, values);
    } else {
      await createPO(values);
    }
  };

  const onSaveDraft = async (values) => {
    try {
      await persistDraft(values);
      setFormOpen(false);
      showToast('บันทึกฉบับร่างแล้ว');
      load();
    } catch {
      showToast('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const onSubmitForReview = async (values) => {
    try {
      let id = editPO && editPO.id;
      if (editPO) {
        await updatePO(id, values);
      } else {
        const res = await createPO(values);
        id = res.data.id;
      }
      const sres = await submitPO(id);
      setFormOpen(false);
      if (sres.data && sres.data.emailSent === false) {
        showToast('บันทึกสำเร็จ แต่ส่งอีเมลไม่ได้ กรุณาแจ้งผู้จัดซื้อด้วยตนเอง', 'warn');
      } else {
        showToast('ส่งให้ผู้จัดซื้อและแจ้งอีเมลแล้ว');
      }
      load();
    } catch {
      showToast('ส่งไม่สำเร็จ', 'error');
    }
  };

  // ---- row actions ----
  const withPO = (setter) => async (po) => {
    try {
      const res = await fetchPOById(po.id);
      setter(res.data);
    } catch {
      showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
    }
  };
  const openEdit = async (po) => {
    try {
      const res = await fetchPOById(po.id);
      setEditPO(res.data);
      setFormOpen(true);
    } catch {
      showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
    }
  };
  const openCreate = () => { setEditPO(null); setFormOpen(true); };
  const openOrdered = withPO(setOrderedPO);
  const openReceived = withPO(setReceivedPO);
  const openDetail = withPO(setDetailPO);

  const onDelete = async () => {
    const po = deleteTarget;
    setDeleteTarget(null);
    if (!po) return;
    try {
      await deletePO(po.id);
      showToast('ลบฉบับร่างแล้ว');
      load();
    } catch {
      showToast('ลบไม่สำเร็จ', 'error');
    }
  };

  const onConfirmOrdered = async (formData) => {
    try {
      await confirmPOOrdered(orderedPO.id, formData);
      setOrderedPO(null);
      showToast('ยืนยันสั่งซื้อแล้ว');
      load();
    } catch {
      showToast('ยืนยันไม่สำเร็จ', 'error');
    }
  };

  const onConfirmReceived = async (payload) => {
    try {
      await confirmPOReceived(receivedPO.id, payload);
      setReceivedPO(null);
      showToast('ยืนยันรับของแล้ว');
      load();
    } catch {
      showToast('ยืนยันไม่สำเร็จ', 'error');
    }
  };

  const actions = (po) => {
    if (po.status === 'draft') {
      return (
        <div className="flex gap-1.5">
          <button className="mes-btn mes-btn-ghost !min-h-touch md:!min-h-0 md:!py-1.5 text-xs" onClick={() => openEdit(po)}>แก้ไข</button>
          <button className="mes-btn mes-btn-danger !min-h-touch md:!min-h-0 md:!py-1.5 text-xs" onClick={() => setDeleteTarget(po)}>ลบ</button>
        </div>
      );
    }
    if (po.status === 'submitted' && isBuyer) {
      return <button className="mes-btn mes-btn-primary !min-h-touch md:!min-h-0 md:!py-1.5 text-xs" onClick={() => openOrdered(po)}>ยืนยันสั่งซื้อ</button>;
    }
    if (po.status === 'ordered' && isBuyer) {
      return <button className="mes-btn mes-btn-primary !min-h-touch md:!min-h-0 md:!py-1.5 text-xs" onClick={() => openReceived(po)}>ยืนยันรับของ</button>;
    }
    return <button className="mes-btn mes-btn-ghost !min-h-touch md:!min-h-0 md:!py-1.5 text-xs" onClick={() => openDetail(po)}>ดูรายละเอียด</button>;
  };

  return (
    <div className="mes-card">
      <CardHeader
        title="ใบสั่งซื้อวัตถุดิบ (PO)"
        right={
          <button className="mes-btn mes-btn-primary" onClick={openCreate}>
            <Icon name="plus" size={15} /> สร้าง PO ใหม่
          </button>
        }
      />

      <div className="flex gap-1 overflow-x-auto border-b border-mes-border px-3 pt-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`min-h-touch md:min-h-0 whitespace-nowrap rounded-t-sm px-3 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === t.key ? 'border-mes-accent text-mes-accent' : 'border-transparent text-mes-muted hover:text-mes-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon="file-invoice" title="ไม่พบใบสั่งซื้อ" />
      ) : (
        <>
          {/* base: cards */}
          <div className="flex flex-col gap-2 p-3 md:hidden">
            {filtered.map((po) => {
              const isHi = highlightId && String(po.id) === highlightId;
              return (
                <div key={po.id} className={`mes-card p-3 ${isHi ? 'border-mes-accent' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{po.po_number}</span>
                    <span className="ml-auto"><StatusBadge status={po.status} kind="po" /></span>
                  </div>
                  <div className="mt-1 truncate text-sm text-mes-muted">{po.project_name || 'รวมหลายโครงการ'}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-mes-muted tabular-nums">
                    <span>{po.item_count} รายการ</span>
                    <span>วันที่สร้าง {dateStr(po.created_at)}</span>
                    <span>กำหนดส่ง {dateStr(po.requested_delivery_date)}</span>
                  </div>
                  <div className="mt-2">{actions(po)}</div>
                </div>
              );
            })}
          </div>
          {/* md+: table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="mes-th">เลขที่ PO</th>
                  <th className="mes-th">โครงการ</th>
                  <th className="mes-th text-right">รายการ</th>
                  <th className="mes-th">วันที่สร้าง</th>
                  <th className="mes-th">กำหนดส่ง</th>
                  <th className="mes-th">สถานะ</th>
                  <th className="mes-th text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((po) => {
                  const isHi = highlightId && String(po.id) === highlightId;
                  return (
                    <tr
                      key={po.id}
                      className={isHi ? 'bg-mes-surface-2' : ''}
                      style={isHi ? { boxShadow: 'inset 3px 0 0 var(--mes-accent)' } : undefined}
                    >
                      <td className="mes-td font-mono">{po.po_number}</td>
                      <td className="mes-td">
                        <span className={`block max-w-[240px] truncate ${po.project_name ? '' : 'text-mes-muted'}`}>
                          {po.project_name || 'รวมหลายโครงการ'}
                        </span>
                      </td>
                      <td className="mes-td text-right">{po.item_count}</td>
                      <td className="mes-td">{dateStr(po.created_at)}</td>
                      <td className="mes-td">{dateStr(po.requested_delivery_date)}</td>
                      <td className="mes-td"><StatusBadge status={po.status} kind="po" /></td>
                      <td className="mes-td"><div className="flex justify-end">{actions(po)}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <FVPurchaseOrder
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialValues={editInitialValues}
        lockProjectId={editPO ? null : lockProjectId}
        onSaveDraft={onSaveDraft}
        onSubmitForReview={onSubmitForReview}
      />
      <POOrderedDialog
        open={Boolean(orderedPO)} po={orderedPO}
        onClose={() => setOrderedPO(null)} onConfirm={onConfirmOrdered}
      />
      <POReceivedDialog
        open={Boolean(receivedPO)} po={receivedPO}
        onClose={() => setReceivedPO(null)} onConfirm={onConfirmReceived}
      />
      <PODetailDialog
        open={Boolean(detailPO)} po={detailPO}
        onClose={() => setDetailPO(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        title="ลบใบสั่งซื้อ"
        message={`ลบใบสั่งซื้อ ${deleteTarget?.po_number || ''}?`}
        confirmLabel="ลบ"
        danger
      />
      {toastNode}
    </div>
  );
};

export default FormPO;
