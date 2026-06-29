import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Slide,
  AppBar,
  Toolbar,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import Chart from 'react-apexcharts';
import { fetchProjectsWithOtherComponents, updateOtherComponentStatus } from 'src/utils/api';

import tiebeamIcon from 'src/assets/card-icons/tiebeam.gif';
import carstopIcon from 'src/assets/card-icons/carstop.gif';
import holeIcon from 'src/assets/card-icons/hole.gif';
import otherIcon from 'src/assets/card-icons/other.gif';

// ─── Cumulative pipeline for Tab 2 ────────────────────────────────────────────
// Tab 2 pipeline: planning → manufactured → transported (rejected is isolated).
// A piece at 'transported' also counts toward 'manufactured'.
// This is only for DISPLAY (donuts). Form validation always uses raw bucket counts.

const OTHER_CUMULATIVE_PIPE = ['manufactured', 'transported'];

function buildCumulativeForOther(rawStatuses) {
  const cum = { ...rawStatuses };
  // Walk backwards: each stage absorbs all later-stage counts
  for (let i = OTHER_CUMULATIVE_PIPE.length - 2; i >= 0; i--) {
    const curr = OTHER_CUMULATIVE_PIPE[i];
    const next = OTHER_CUMULATIVE_PIPE[i + 1];
    cum[curr] = (cum[curr] || 0) + (cum[next] || 0);
  }
  return cum;
}

// ─── Domain Constants ─────────────────────────────────────────────────────────

const STATUSES = ['planning', 'manufactured', 'transported', 'rejected'];

const STATUS_THAI = {
  planning: 'รอผลิต',
  manufactured: 'ผลิตแล้ว',
  transported: 'ขนส่งสำเร็จ',
  rejected: 'ถูกปฏิเสธ',
};

const STATUS_COLORS = {
  planning: '#64b5f6',
  manufactured: '#82ca9d',
  transported: '#ffc658',
  rejected: '#ff6b6b',
};

// Each key lists the only valid destination statuses from that source.
const VALID_TRANSITIONS = {
  planning:     ['manufactured', 'rejected'],
  manufactured: ['transported', 'rejected', 'planning'],
  transported:  ['rejected', 'manufactured', 'planning'],
  rejected:     ['transported'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProjectIcon(projectCode = '') {
  if (projectCode.startsWith('เสาเอ็น'))   return tiebeamIcon;
  if (projectCode.startsWith('คันกั้นล้อ')) return carstopIcon;
  if (projectCode.startsWith('บ่อ'))       return holeIcon;
  return otherIcon;
}

function validateUpdate(component, fromStatus, toStatus, rawQty) {
  if (!fromStatus || !toStatus)
    return 'กรุณาเลือกสถานะต้นทางและปลายทาง';
  if (fromStatus === toStatus)
    return 'สถานะต้นทางและปลายทางต้องไม่เหมือนกัน';

  const qty = parseInt(rawQty, 10);
  if (isNaN(qty) || qty <= 0)
    return 'จำนวนต้องเป็นตัวเลขที่มากกว่า 0';

  const available = component.statuses[fromStatus] || 0;
  if (qty > available)
    return `จำนวนเกินกว่าที่มีในสถานะ "${STATUS_THAI[fromStatus]}" (มีอยู่ ${available} ชิ้น)`;

  if (!VALID_TRANSITIONS[fromStatus]?.includes(toStatus))
    return `ไม่สามารถเปลี่ยนสถานะจาก "${STATUS_THAI[fromStatus]}" ไปยัง "${STATUS_THAI[toStatus]}" ได้`;

  return null;
}

// ─── StatusDonut ──────────────────────────────────────────────────────────────

const StatusDonut = memo(({ status, component, displayCount }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  // displayCount carries the cumulative value; fall back to raw bucket if not provided
  const count = displayCount !== undefined ? displayCount : (component.statuses[status] || 0);
  const total = component.total > 0 ? component.total : 1;
  const color = STATUS_COLORS[status];

  const options = useMemo(() => ({
    chart: {
      type: 'donut',
      background: 'transparent',
      parentHeightOffset: 0,
      toolbar: { show: false },
    },
    labels: [STATUS_THAI[status], 'อื่นๆ'],
    colors: [color, '#EAEEF3'],
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { show: false },
            value: { show: false },
            total: {
              show: true,
              showAlways: true,
              label: STATUS_THAI[status],
              fontSize: isSmall ? '9px' : '11px',
              color: theme.palette.text.secondary,
              formatter: (w) => {
                const s = w.config.series;
                const t = s[0] + s[1];
                return t > 0 ? `${((s[0] / t) * 100).toFixed(1)}%` : '0%';
              },
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => `${v} ชิ้น` } },
    stroke: { show: false },
  }), [status, color, isSmall, theme.palette.text.secondary]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        sx={{
          color,
          fontWeight: 700,
          display: 'block',
          mb: 0.25,
          fontSize: isSmall ? '0.6rem' : '0.68rem',
          lineHeight: 1.3,
        }}
      >
        {STATUS_THAI[status]}
        <Box component="span" sx={{ display: 'block', fontWeight: 800, fontSize: isSmall ? '0.7rem' : '0.8rem' }}>
          {count}
        </Box>
      </Typography>
      <Chart
        options={options}
        series={[count, Math.max(total - count, 0)]}
        type="donut"
        width="100%"
        height={isSmall ? 88 : 108}
      />
    </Box>
  );
});

// ─── OtherComponentCard ───────────────────────────────────────────────────────

const OtherComponentCard = memo(({ component, isAdmin, onUpdateStatus }) => {
  const [fromStatus, setFromStatus] = useState('');
  const [toStatus,   setToStatus]   = useState('');
  const [quantity,   setQuantity]   = useState('');
  const [formError,  setFormError]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only show valid destination options for the chosen source status.
  const toOptions = useMemo(
    () => (fromStatus ? (VALID_TRANSITIONS[fromStatus] || []) : []),
    [fromStatus],
  );

  // Cumulative counts for donut display only — raw buckets stay in component.statuses
  const cumulativeStatuses = useMemo(
    () => buildCumulativeForOther(component.statuses || {}),
    [component.statuses],
  );

  // If manufactured > plan total AND some pieces were rejected, the excess
  // represents replacement production — surface this to the operator.
  const surplus = useMemo(() => {
    const mfg  = component.statuses.manufactured || 0;
    const rej  = component.statuses.rejected     || 0;
    return mfg > component.total && rej > 0 ? mfg - component.total : 0;
  }, [component]);

  const handleFromChange = useCallback((e) => {
    setFromStatus(e.target.value);
    setToStatus('');
    setFormError('');
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const err = validateUpdate(component, fromStatus, toStatus, quantity);
    if (err) { setFormError(err); return; }

    setSubmitting(true);
    setFormError('');
    try {
      await onUpdateStatus(component.id, fromStatus, toStatus, parseInt(quantity, 10));
      setFromStatus('');
      setToStatus('');
      setQuantity('');
    } catch (apiErr) {
      setFormError(apiErr?.message || 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }, [component, fromStatus, toStatus, quantity, onUpdateStatus]);

  return (
    <Box
      sx={{
        background: 'var(--card, #fff)',
        border: '1px solid var(--line, #E3E8EF)',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-card, 0 1px 2px rgba(20,33,56,.04),0 8px 24px -12px rgba(20,33,56,.18))',
        p: { xs: 1.5, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.88rem',
            color: 'var(--ink, #1C2738)',
            lineHeight: 1.3,
          }}
        >
          {component.name}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: 'var(--ink2, #566175)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ทั้งหมด {component.total} ชิ้น
        </Typography>
      </Box>

      {/* Replacement-production banner */}
      {surplus > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: '#EBF3FE',
            border: '1px solid #B3D4FC',
            borderRadius: '7px',
            px: 1.5,
            py: 0.75,
          }}
        >
          <InfoIcon sx={{ color: '#539BFF', fontSize: 17, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.77rem', color: '#1682d4', lineHeight: 1.4 }}>
            ผลิตเพิ่ม <strong>{surplus} ชิ้น</strong> ทดแทนชิ้นงานที่ถูกปฏิเสธ
          </Typography>
        </Box>
      )}

      {/* 4 Donut charts — cumulative counts for display, raw data untouched */}
      <Grid container spacing={1}>
        {STATUSES.map((s) => (
          <Grid item xs={6} sm={3} key={s}>
            <StatusDonut
              status={s}
              component={component}
              displayCount={cumulativeStatuses[s] ?? 0}
            />
          </Grid>
        ))}
      </Grid>

      {/* Status update section */}
      {isAdmin ? (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            borderTop: '1px solid var(--line, #E3E8EF)',
            pt: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '.5px',
              color: 'var(--ink2, #566175)',
              textTransform: 'uppercase',
            }}
          >
            อัปเดตสถานะ
          </Typography>

          <Grid container spacing={1.5} alignItems="flex-end">
            {/* From status */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>จากสถานะ</InputLabel>
                <Select value={fromStatus} label="จากสถานะ" onChange={handleFromChange}>
                  {STATUSES.map((s) => {
                    const rawCount = component.statuses[s] || 0;
                    return (
                      <MenuItem key={s} value={s} disabled={rawCount === 0}>
                        {STATUS_THAI[s]} ({rawCount} คงเหลือ)
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* To status — only valid options shown */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" disabled={!fromStatus}>
                <InputLabel>ไปยังสถานะ</InputLabel>
                <Select
                  value={toStatus}
                  label="ไปยังสถานะ"
                  onChange={(e) => { setToStatus(e.target.value); setFormError(''); }}
                >
                  {toOptions.map((s) => (
                    <MenuItem key={s} value={s}>{STATUS_THAI[s]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={8} sm={2}>
              <TextField
                fullWidth
                size="small"
                label="จำนวน"
                type="text"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setFormError(''); }}
              />
            </Grid>

            {/* Submit */}
            <Grid item xs={4} sm={2}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="small"
                disabled={submitting || !fromStatus || !toStatus || !quantity}
                sx={{
                  background: 'var(--accent, #3D5A80)',
                  textTransform: 'none',
                  fontWeight: 700,
                  height: 40,
                  '&:hover': {
                    background: 'var(--accent, #3D5A80)',
                    filter: 'brightness(1.1)',
                  },
                  '&.Mui-disabled': { opacity: 0.5 },
                }}
              >
                {submitting
                  ? <CircularProgress size={17} sx={{ color: '#fff' }} />
                  : 'บันทึก'}
              </Button>
            </Grid>
          </Grid>

          {formError && (
            <Alert severity="error" sx={{ py: 0.5, fontSize: '0.8rem' }}>
              {formError}
            </Alert>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: '#FEF5E5',
            border: '1px solid #FFD78C',
            borderRadius: '7px',
            px: 1.5,
            py: 0.9,
          }}
        >
          <LockIcon sx={{ color: '#FFAE1F', fontSize: 16, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.77rem', color: '#ae8e59' }}>
            เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถอัปเดตสถานะได้
          </Typography>
        </Box>
      )}
    </Box>
  );
});

// ─── Slide-up transition for the Modal ───────────────────────────────────────

const SlideUp = React.forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ─── OtherProjectModal ────────────────────────────────────────────────────────

const OtherProjectModal = memo(({ project, open, onClose, isAdmin, onUpdateStatus }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  if (!project) return null;

  const components = project.components || [];
  const totalPieces = components.reduce((sum, c) => sum + (c.total || 0), 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isXs}
      maxWidth="lg"
      fullWidth
      TransitionComponent={SlideUp}
      PaperProps={{
        sx: {
          borderRadius: isXs ? 0 : '12px',
          overflow: 'hidden',
          maxHeight: '92vh',
        },
      }}
    >
      {/* ── Header ── */}
      {isXs ? (
        <AppBar sx={{ position: 'relative', background: 'var(--steel-850, #172030)' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose} aria-label="ปิด">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6" noWrap>
              {project.name}
            </Typography>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle
          component="div"
          sx={{
            background: 'var(--steel-850, #172030)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 2,
          }}
        >
          {/* Left: name + code */}
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2 }}
            >
              {project.name}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#AEBED4',
                mt: 0.4,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {project.project_code}
            </Typography>
          </Box>

          {/* Right: KPI chips + close */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: '8px',
                px: 1.5,
                py: 0.75,
                textAlign: 'center',
                minWidth: 56,
              }}
            >
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {components.length}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: '#AEBED4', mt: 0.2 }}>
                ประเภท
              </Typography>
            </Box>
            <Box
              sx={{
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: '8px',
                px: 1.5,
                py: 0.75,
                textAlign: 'center',
                minWidth: 56,
              }}
            >
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {totalPieces}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: '#AEBED4', mt: 0.2 }}>
                ชิ้นงาน
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: '#fff',
                background: 'rgba(255,255,255,.1)',
                '&:hover': { background: 'rgba(255,255,255,.22)' },
                width: 34,
                height: 34,
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
      )}

      {/* ── Body ── */}
      <DialogContent
        sx={{
          background: 'var(--bg, #EAEEF3)',
          p: { xs: 1.5, sm: 2.5 },
          overflowY: 'auto',
        }}
      >
        {components.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'var(--ink3, #8A97AB)' }}>
            <Typography sx={{ fontWeight: 600 }}>ไม่พบชิ้นงานในโครงการนี้</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {components.map((comp) => (
              <Grid item xs={12} md={6} key={comp.id}>
                <OtherComponentCard
                  component={comp}
                  isAdmin={isAdmin}
                  onUpdateStatus={onUpdateStatus}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      {/* ── Footer ── */}
      {!isXs && (
        <DialogActions
          sx={{
            background: 'var(--card, #fff)',
            borderTop: '1px solid var(--line, #E3E8EF)',
            px: 3,
            py: 1.5,
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              color: 'var(--ink2, #566175)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { background: 'var(--hover, #F3F6FB)' },
            }}
          >
            ปิด
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
});

// ─── OtherProjectCard ─────────────────────────────────────────────────────────

const OtherProjectCard = memo(({ project, onClick }) => {
  const icon = useMemo(() => getProjectIcon(project.project_code || ''), [project.project_code]);

  const totalPieces = useMemo(
    () => (project.components || []).reduce((sum, c) => sum + (c.total || 0), 0),
    [project.components],
  );

  const componentCount = project.components?.length || 0;

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      sx={{
        background: 'var(--card, #fff)',
        border: '1px solid var(--line, #E3E8EF)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-card, 0 1px 2px rgba(20,33,56,.04),0 8px 24px -12px rgba(20,33,56,.18))',
        cursor: 'pointer',
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        transition: 'transform .18s cubic-bezier(.4,0,.2,1), box-shadow .18s, border-color .18s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 28px -8px rgba(20,33,56,.22)',
          borderColor: 'var(--accent, #3D5A80)',
        },
        '&:focus-visible': {
          outline: '2px solid var(--accent, #3D5A80)',
          outlineOffset: 2,
        },
      }}
    >
      {/* GIF icon inside accent ring */}
      <Box
        sx={{
          width: 68,
          height: 68,
          borderRadius: '50%',
          border: '2.5px solid var(--accent, #3D5A80)',
          background: 'color-mix(in oklab, var(--accent, #3D5A80) 9%, #fff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform .2s',
          '&:hover': { transform: 'scale(1.06)' },
        }}
      >
        <Box
          component="img"
          src={icon}
          alt={project.name}
          sx={{ width: 46, height: 46, objectFit: 'contain', borderRadius: '50%' }}
        />
      </Box>

      {/* Project name + code */}
      <Box sx={{ textAlign: 'center', width: '100%', flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.85rem',
            color: 'var(--ink, #1C2738)',
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {project.name}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.68rem',
            color: 'var(--ink3, #8A97AB)',
            mt: 0.4,
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          {project.project_code}
        </Typography>
      </Box>

      {/* KPI strip */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          borderTop: '1px solid var(--line, #E3E8EF)',
          pt: 1.25,
          gap: 0,
        }}
      >
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent, #3D5A80)', lineHeight: 1 }}>
            {componentCount}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: 'var(--ink3, #8A97AB)', fontWeight: 600, mt: 0.3 }}>
            ประเภทชิ้นงาน
          </Typography>
        </Box>
        <Box sx={{ width: '1px', background: 'var(--line, #E3E8EF)' }} />
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink, #1C2738)', lineHeight: 1 }}>
            {totalPieces}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: 'var(--ink3, #8A97AB)', fontWeight: 600, mt: 0.3 }}>
            ชิ้นงานทั้งหมด
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

// ─── OtherProjectsTab (root of this domain) ───────────────────────────────────

const OtherProjectsTab = ({ userRole }) => {
  const [projects,         setProjects]         = useState([]);
  const [selectedProject,  setSelectedProject]  = useState(null);
  const [modalOpen,        setModalOpen]        = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [fetchError,       setFetchError]       = useState(null);
  const [snackbar,         setSnackbar]         = useState({ open: false, message: '', severity: 'info' });

  const isAdmin    = userRole === 'Admin';
  const isLoggedIn = !!localStorage.getItem('token');

  // Re-fetch all projects. If a project was selected when this runs, find its
  // refreshed version and keep the modal data up to date.
  const loadProjects = useCallback(async (currentSelectedId = null) => {
    try {
      setFetchError(null);
      const data = await fetchProjectsWithOtherComponents();
      setProjects(data);
      if (currentSelectedId !== null) {
        const refreshed = data.find((p) => p.id === currentSelectedId);
        if (refreshed) setSelectedProject(refreshed);
      }
    } catch (err) {
      console.error('OtherProjectsTab fetch error:', err);
      setFetchError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleCardClick = useCallback((project) => {
    setSelectedProject(project);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => setModalOpen(false), []);

  const handleUpdateStatus = useCallback(
    async (componentId, fromStatus, toStatus, quantity) => {
      if (!isLoggedIn) {
        setSnackbar({ open: true, message: 'กรุณาเข้าสู่ระบบก่อนอัปเดตสถานะ', severity: 'warning' });
        throw new Error('Not authenticated');
      }
      if (!isAdmin) {
        setSnackbar({ open: true, message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถอัปเดตสถานะได้', severity: 'error' });
        throw new Error('Permission denied');
      }

      await updateOtherComponentStatus(componentId, fromStatus, toStatus, quantity);
      // Refresh in place — keep modal open with updated numbers
      await loadProjects(selectedProject?.id ?? null);
      setSnackbar({ open: true, message: 'อัปเดตสถานะสำเร็จ', severity: 'success' });
    },
    [isLoggedIn, isAdmin, loadProjects, selectedProject?.id],
  );

  const closeSnackbar = useCallback(
    () => setSnackbar((prev) => ({ ...prev, open: false })),
    [],
  );

  // Projects that actually have components to show
  const visibleProjects = useMemo(
    () => projects.filter((p) => p.components && p.components.length > 0),
    [projects],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
        <CircularProgress sx={{ color: 'var(--accent, #3D5A80)' }} />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ p: 2.5 }}>
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => { setLoading(true); loadProjects(); }}>
              ลองอีกครั้ง
            </Button>
          }
        >
          {fetchError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {visibleProjects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'var(--ink3, #8A97AB)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
            ไม่พบโครงการที่มีชิ้นงานอื่นๆ
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {visibleProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
              <OtherProjectCard
                project={project}
                onClick={() => handleCardClick(project)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <OtherProjectModal
        project={selectedProject}
        open={modalOpen}
        onClose={handleCloseModal}
        isAdmin={isAdmin}
        onUpdateStatus={handleUpdateStatus}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OtherProjectsTab;
