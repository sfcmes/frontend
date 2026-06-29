import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Typography,
} from '@mui/material';

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>ยืนยันสั่งซื้อ — {po && po.po_number}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="เลขที่ PO ภายนอก" required value={externalPoNumber}
            onChange={(e) => setExternalPoNumber(e.target.value)}
            error={Boolean(error)} helperText={error}
          />
          <TextField
            type="date" label="กำหนดส่ง (คาดการณ์)" InputLabelProps={{ shrink: true }}
            value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)}
          />
          <div>
            <Typography variant="body2" sx={{ mb: 0.5 }}>แนบเอกสาร PO (PDF/รูปภาพ)</Typography>
            <input
              type="file" accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </div>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button variant="contained" disabled={saving} onClick={submit}>ยืนยัน</Button>
      </DialogActions>
    </Dialog>
  );
};

POOrderedDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  po: PropTypes.shape({
    po_number: PropTypes.string,
  }),
  onConfirm: PropTypes.func.isRequired,
};

POOrderedDialog.defaultProps = {
  po: null,
};

export default POOrderedDialog;
