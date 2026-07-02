// [MES] POOrderedDialog — buyer confirms order placed (external PO no., expected date, optional doc).
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'src/components/mes/ui';

const POOrderedDialog = ({ open, onClose, po, onConfirm }) => {
  const [externalPoNumber, setExternalPoNumber] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setExternalPoNumber('');
      setExpectedDeliveryDate('');
      setFile(null);
      setError('');
    }
  }, [open]);

  const submit = async () => {
    if (!externalPoNumber.trim()) {
      setError('กรุณากรอกเลขที่ PO ภายนอก');
      return;
    }
    const fd = new FormData();
    fd.append('externalPoNumber', externalPoNumber);
    if (expectedDeliveryDate) fd.append('expectedDeliveryDate', expectedDeliveryDate);
    if (file) fd.append('file', file);
    setSaving(true);
    try {
      await onConfirm(fd);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`ยืนยันสั่งซื้อ — ${po ? po.po_number : ''}`}
      footer={
        <>
          <button className="mes-btn mes-btn-ghost" onClick={onClose}>ยกเลิก</button>
          <button className="mes-btn mes-btn-primary" disabled={saving} onClick={submit}>
            {saving ? 'กำลังบันทึก…' : 'ยืนยัน'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="mes-label" htmlFor="ext-po">เลขที่ PO ภายนอก *</label>
          <input
            id="ext-po"
            className="mes-input"
            value={externalPoNumber}
            onChange={(e) => { setExternalPoNumber(e.target.value); setError(''); }}
          />
          {error && <div className="mt-1 text-xs text-sem-danger">{error}</div>}
        </div>
        <div>
          <label className="mes-label" htmlFor="exp-date">กำหนดส่ง (คาดการณ์)</label>
          <input
            id="exp-date"
            className="mes-input"
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mes-label" htmlFor="po-file">แนบเอกสาร PO (PDF/รูปภาพ)</label>
          <input
            id="po-file"
            className="mes-input !py-2.5"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </div>
      </div>
    </Modal>
  );
};

POOrderedDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  po: PropTypes.shape({ po_number: PropTypes.string }),
  onConfirm: PropTypes.func.isRequired,
};

POOrderedDialog.defaultProps = { po: null };

export default POOrderedDialog;
