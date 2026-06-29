import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, Stack,
} from '@mui/material';

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>ยืนยันรับของ — {po && po.po_number}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>วัสดุ</TableCell>
                <TableCell align="right">สั่ง</TableCell>
                <TableCell align="right">รับจริง</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(po && po.items ? po.items : []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.material_name}</TableCell>
                  <TableCell align="right">{it.quantity} {it.unit}</TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small" type="number" sx={{ width: 110 }}
                      value={receipts[it.id] ?? ''}
                      onChange={(e) =>
                        setReceipts((r) => ({ ...r, [it.id]: e.target.value }))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TextField
            label="หมายเหตุการรับของ" multiline minRows={2}
            value={receiveNotes} onChange={(e) => setReceiveNotes(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button variant="contained" disabled={saving} onClick={submit}>ยืนยันรับของ</Button>
      </DialogActions>
    </Dialog>
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

POReceivedDialog.defaultProps = {
  po: null,
};

export default POReceivedDialog;
