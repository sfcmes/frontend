// [MES] POReceivedDialog — buyer confirms goods received (per-item actual quantities).
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'src/components/mes/ui';

const POReceivedDialog = ({ open, onClose, po, onConfirm }) => {
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receipts, setReceipts] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && po) {
      setReceiveNotes('');
      const init = {};
      (po.items || []).forEach((it) => { init[it.id] = it.quantity; });
      setReceipts(init);
    }
  }, [open, po]);

  const submit = async () => {
    const itemReceipts = Object.entries(receipts).map(([id, q]) => ({
      id, receiveQuantity: Number(q),
    }));
    setSaving(true);
    try {
      await onConfirm({ receiveNotes, itemReceipts });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`ยืนยันรับของ — ${po ? po.po_number : ''}`}
      footer={
        <>
          <button className="mes-btn mes-btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="mes-btn mes-btn-primary" disabled={saving} onClick={submit}>
            {saving ? 'กำลังบันทึก…' : 'ยืนยันรับของ'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {(po && po.items ? po.items : []).map((it) => (
          <div key={it.id} className="flex items-center gap-3 rounded-sm border border-mes-border px-3 py-2">
            <div className="min-w-0 grow">
              <div className="truncate text-sm font-medium">{it.material_name}</div>
              <div className="text-xs text-mes-muted tabular-nums">สั่ง {it.quantity} {it.unit}</div>
            </div>
            <div className="w-28 shrink-0">
              <label className="mes-label !mb-1">รับจริง</label>
              <input
                className="mes-input"
                type="number"
                inputMode="decimal"
                value={receipts[it.id] ?? ''}
                onChange={(e) => setReceipts((r) => ({ ...r, [it.id]: e.target.value }))}
              />
            </div>
          </div>
        ))}
        <div className="mt-1">
          <label className="mes-label" htmlFor="recv-notes">หมายเหตุการรับของ</label>
          <textarea
            id="recv-notes"
            className="mes-input"
            rows={2}
            value={receiveNotes}
            onChange={(e) => setReceiveNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

POReceivedDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  po: PropTypes.shape({
    po_number: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        material_name: PropTypes.string,
        quantity: PropTypes.number,
        unit: PropTypes.string,
      }),
    ),
  }),
  onConfirm: PropTypes.func.isRequired,
};

POReceivedDialog.defaultProps = { po: null };

export default POReceivedDialog;
