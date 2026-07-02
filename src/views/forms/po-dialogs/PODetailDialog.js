// [MES] PODetailDialog — read-only PO detail with line items.
import PropTypes from 'prop-types';
import { Modal } from 'src/components/mes/ui';
import { StatusBadge } from 'src/components/mes/StatusBadge';

const Row = ({ label, value }) => (
  <div>
    <div className="text-xs text-mes-muted">{label}</div>
    <div className="text-sm">{value || '-'}</div>
  </div>
);
Row.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node };
Row.defaultProps = { value: '' };

const PODetailDialog = ({ open, onClose, po }) => {
  if (!po) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={`${po.po_number} — ${po.project_name}`}
      footer={<button className="mes-btn mes-btn-ghost" onClick={onClose}>ปิด</button>}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs text-mes-muted">สถานะ</div>
          <div className="mt-0.5"><StatusBadge status={po.status} kind="po" /></div>
        </div>
        <Row label="อีเมลผู้จัดซื้อ" value={po.buyer_email} />
        <Row label="กำหนดส่งที่ต้องการ" value={po.requested_delivery_date} />
        <Row label="เลขที่ PO ภายนอก" value={po.external_po_number} />
        <Row label="กำหนดส่ง (คาดการณ์)" value={po.expected_delivery_date} />
        <Row label="วันที่รับของ" value={po.received_at} />
        {po.notes && <Row label="หมายเหตุ" value={po.notes} />}
        {po.po_document_url && (
          <div className="sm:col-span-2">
            <a
              className="text-sm font-semibold text-mes-accent underline underline-offset-2"
              href={po.po_document_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              เปิดเอกสาร PO ที่แนบ
            </a>
          </div>
        )}
      </div>

      <div className="mt-5 mb-2 text-sm font-semibold">รายการวัสดุ</div>
      <div className="flex flex-col gap-1.5">
        {(po.items || []).map((it) => (
          <div key={it.id} className="flex items-center gap-3 rounded-sm border border-mes-border px-3 py-2 text-sm">
            <span className="min-w-0 grow truncate font-medium">{it.material_name}</span>
            <span className="shrink-0 text-xs text-mes-muted">{it.unit}</span>
            <span className="w-24 shrink-0 text-right tabular-nums">จำนวน {it.quantity}</span>
            <span className="w-24 shrink-0 text-right tabular-nums text-mes-muted">รับจริง {it.receive_quantity ?? '-'}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
};

PODetailDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  po: PropTypes.object,
};

PODetailDialog.defaultProps = { po: null };

export default PODetailDialog;
