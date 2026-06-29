import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableHead, TableRow, TableCell, TableBody, Typography, Grid, Link,
} from '@mui/material';

const Row = ({ label, value }) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2">{value || '-'}</Typography>
  </Grid>
);

Row.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

Row.defaultProps = {
  value: '',
};

const PODetailDialog = ({ open, onClose, po }) => {
  if (!po) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{po.po_number} — {po.project_name}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Row label="สถานะ" value={po.status} />
          <Row label="อีเมลผู้จัดซื้อ" value={po.buyer_email} />
          <Row label="กำหนดส่งที่ต้องการ" value={po.requested_delivery_date} />
          <Row label="เลขที่ PO ภายนอก" value={po.external_po_number} />
          <Row label="กำหนดส่ง (คาดการณ์)" value={po.expected_delivery_date} />
          <Row label="วันที่รับของ" value={po.received_at} />
          {po.notes && <Row label="หมายเหตุ" value={po.notes} />}
          {po.po_document_url && (
            <Grid item xs={12}>
              <Link href={po.po_document_url} target="_blank" rel="noopener">
                เปิดเอกสาร PO ที่แนบ
              </Link>
            </Grid>
          )}
        </Grid>

        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>รายการวัสดุ</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>วัสดุ</TableCell>
              <TableCell>หน่วย</TableCell>
              <TableCell align="right">จำนวน</TableCell>
              <TableCell align="right">รับจริง</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(po.items || []).map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.material_name}</TableCell>
                <TableCell>{it.unit}</TableCell>
                <TableCell align="right">{it.quantity}</TableCell>
                <TableCell align="right">{it.receive_quantity ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
};

PODetailDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  po: PropTypes.shape({
    po_number: PropTypes.string,
    project_name: PropTypes.string,
    status: PropTypes.string,
    buyer_email: PropTypes.string,
    requested_delivery_date: PropTypes.string,
    external_po_number: PropTypes.string,
    expected_delivery_date: PropTypes.string,
    received_at: PropTypes.string,
    notes: PropTypes.string,
    po_document_url: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        material_name: PropTypes.string,
        unit: PropTypes.string,
        quantity: PropTypes.number,
        receive_quantity: PropTypes.number,
      }),
    ),
  }),
};

PODetailDialog.defaultProps = {
  po: null,
};

export default PODetailDialog;
