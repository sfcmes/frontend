import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Stack, Typography, Button, Tabs, Tab, Chip, Snackbar, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, CircularProgress,
} from '@mui/material';
import { useAuth } from 'src/contexts/AuthContext';
import {
  fetchAllPOs, fetchPOById, createPO, updatePO, deletePO, submitPO,
  confirmPOOrdered, confirmPOReceived,
} from 'src/utils/api';
import FVPurchaseOrder from 'src/components/forms/form-validation/FVPurchaseOrder';
import POOrderedDialog from './po-dialogs/POOrderedDialog';
import POReceivedDialog from './po-dialogs/POReceivedDialog';
import PODetailDialog from './po-dialogs/PODetailDialog';

const STATUS_META = {
  draft:     { label: 'ฉบับร่าง',   color: '#566175' },
  submitted: { label: 'รอสั่งซื้อ', color: '#E08A00' },
  ordered:   { label: 'สั่งซื้อแล้ว', color: '#5D87FF' },
  received:  { label: 'รับของแล้ว', color: '#2E9E5B' },
};

const TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'submitted', label: 'รอดำเนินการ' },
  { key: 'ordered', label: 'สั่งซื้อแล้ว' },
  { key: 'received', label: 'รับของแล้ว' },
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

const FormPO = () => {
  const { user } = useAuth();
  const isBuyer = user && (user.role === 'buyer' || user.role === 'Admin');
  const [params] = useSearchParams();
  const lockProjectId = params.get('project');
  const highlightId = params.get('highlight');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [toast, setToast] = useState(null); // { severity, msg }

  const [formOpen, setFormOpen] = useState(false);
  const [editPO, setEditPO] = useState(null);     // full po for edit, or null for create
  const [orderedPO, setOrderedPO] = useState(null);
  const [receivedPO, setReceivedPO] = useState(null);
  const [detailPO, setDetailPO] = useState(null);

  // Memoize to avoid giving FVPurchaseOrder a new object every render
  const editInitialValues = useMemo(() => (editPO ? toFormValues(editPO) : null), [editPO]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllPOs();
      setRows(res.data || []);
    } catch (err) {
      setToast({ severity: 'error', msg: 'โหลดข้อมูลไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  }, []);

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
      setToast({ severity: 'success', msg: 'บันทึกฉบับร่างแล้ว' });
      load();
    } catch (err) {
      setToast({ severity: 'error', msg: 'บันทึกไม่สำเร็จ' });
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
        setToast({
          severity: 'warning',
          msg: 'บันทึกสำเร็จ แต่ส่งอีเมลไม่ได้ กรุณาแจ้งผู้จัดซื้อด้วยตนเอง',
        });
      } else {
        setToast({ severity: 'success', msg: 'ส่งให้ผู้จัดซื้อและแจ้งอีเมลแล้ว' });
      }
      load();
    } catch (err) {
      setToast({ severity: 'error', msg: 'ส่งไม่สำเร็จ' });
    }
  };

  // ---- row actions ----
  const openEdit = async (po) => {
    try {
      const res = await fetchPOById(po.id);
      setEditPO(res.data);
      setFormOpen(true);
    } catch (err) {
      setToast({ severity: 'error', msg: 'โหลดข้อมูลไม่สำเร็จ' });
    }
  };
  const openCreate = () => { setEditPO(null); setFormOpen(true); };
  const openOrdered = async (po) => {
    try { const r = await fetchPOById(po.id); setOrderedPO(r.data); }
    catch (err) { setToast({ severity: 'error', msg: 'โหลดข้อมูลไม่สำเร็จ' }); }
  };
  const openReceived = async (po) => {
    try { const r = await fetchPOById(po.id); setReceivedPO(r.data); }
    catch (err) { setToast({ severity: 'error', msg: 'โหลดข้อมูลไม่สำเร็จ' }); }
  };
  const openDetail = async (po) => {
    try { const r = await fetchPOById(po.id); setDetailPO(r.data); }
    catch (err) { setToast({ severity: 'error', msg: 'โหลดข้อมูลไม่สำเร็จ' }); }
  };

  const onDelete = async (po) => {
    if (!window.confirm(`ลบใบสั่งซื้อ ${po.po_number}?`)) return;
    try {
      await deletePO(po.id);
      setToast({ severity: 'success', msg: 'ลบฉบับร่างแล้ว' });
      load();
    } catch (err) {
      setToast({ severity: 'error', msg: 'ลบไม่สำเร็จ' });
    }
  };

  const onConfirmOrdered = async (formData) => {
    try {
      await confirmPOOrdered(orderedPO.id, formData);
      setOrderedPO(null);
      setToast({ severity: 'success', msg: 'ยืนยันสั่งซื้อแล้ว' });
      load();
    } catch (err) {
      setToast({ severity: 'error', msg: 'ยืนยันไม่สำเร็จ' });
    }
  };

  const onConfirmReceived = async (payload) => {
    try {
      await confirmPOReceived(receivedPO.id, payload);
      setReceivedPO(null);
      setToast({ severity: 'success', msg: 'ยืนยันรับของแล้ว' });
      load();
    } catch (err) {
      setToast({ severity: 'error', msg: 'ยืนยันไม่สำเร็จ' });
    }
  };

  const renderActions = (po) => {
    if (po.status === 'draft') {
      return (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => openEdit(po)}>แก้ไข</Button>
          <Button size="small" color="error" onClick={() => onDelete(po)}>ลบ</Button>
        </Stack>
      );
    }
    if (po.status === 'submitted' && isBuyer) {
      return <Button size="small" variant="contained" onClick={() => openOrdered(po)}>ยืนยันสั่งซื้อ</Button>;
    }
    if (po.status === 'ordered' && isBuyer) {
      return <Button size="small" variant="contained" onClick={() => openReceived(po)}>ยืนยันรับของ</Button>;
    }
    return <Button size="small" onClick={() => openDetail(po)}>ดูรายละเอียด</Button>;
  };

  return (
    <Box className="mes-card" sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">ใบสั่งซื้อวัตถุดิบ (PO)</Typography>
        <Button variant="contained" onClick={openCreate}>+ สร้าง PO ใหม่</Button>
      </Stack>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        {TABS.map((t) => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">ไม่พบใบสั่งซื้อ</Alert>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>เลขที่ PO</TableCell>
              <TableCell>โครงการ</TableCell>
              <TableCell align="right">รายการ</TableCell>
              <TableCell>วันที่สร้าง</TableCell>
              <TableCell>กำหนดส่ง</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="right">การจัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((po) => {
              const meta = STATUS_META[po.status] || { label: po.status, color: '#888' };
              const isHi = highlightId && String(po.id) === highlightId;
              return (
                <TableRow key={po.id} sx={isHi ? { background: 'rgba(93,135,255,.12)' } : undefined}>
                  <TableCell>{po.po_number}</TableCell>
                  <TableCell>{po.project_name}</TableCell>
                  <TableCell align="right">{po.item_count}</TableCell>
                  <TableCell>{po.created_at ? String(po.created_at).slice(0, 10) : '-'}</TableCell>
                  <TableCell>
                    {po.requested_delivery_date ? String(po.requested_delivery_date).slice(0, 10) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small" label={meta.label}
                      sx={{ background: meta.color, color: '#fff' }}
                    />
                  </TableCell>
                  <TableCell align="right">{renderActions(po)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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

      <Snackbar
        open={Boolean(toast)} autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.msg}</Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default FormPO;
