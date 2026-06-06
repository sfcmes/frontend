import React from 'react';
import { Grid, Box, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { alpha } from '@mui/material/styles';
import producedGif from 'src/assets/animated-icons/producedgif.gif';
import transporting from 'src/assets/animated-icons/transporting.gif';
import accepted from 'src/assets/animated-icons/accepted.gif';
import installed from 'src/assets/animated-icons/installed.gif';
import rejected from 'src/assets/animated-icons/rejected.gif';

const COLORS = {
  planning: '#64b5f6',
  manufactured: '#82ca9d',
  transported: '#ffc658',
  accepted: '#8e44ad',
  installed: '#27ae60',
  rejected: '#ff6b6b',
};

const STATUS_THAI = {
  planning: 'วางแผน',
  manufactured: 'ผลิตแล้ว',
  transported: 'ขนส่งสำเร็จ',
  accepted: 'ตรวจรับแล้ว',
  installed: 'ติดตั้งแล้ว',
  rejected: 'ถูกปฏิเสธ',
};

const getStatusColor = (status) => {
  return { bg: COLORS[status] || '#gray', color: '#ffffff' };
};

const getStatusGif = (status) => {
  switch (status) {
    case 'manufactured':
      return producedGif;
    case 'transported':
      return transporting;
    case 'accepted':
      return accepted;
    case 'installed':
      return installed;
    case 'rejected':
      return rejected;
    default:
      return producedGif;
  }
};

// Updated status order - removed in_transit, using only transported
const statusOrder = ['manufactured', 'transported', 'accepted', 'installed', 'rejected'];

const TopCards = ({ stats, projectName, isResetState }) => {
  const theme = useTheme();
  const isXsScreen = useMediaQuery(theme.breakpoints.only('xs'));
  const isSmScreen = useMediaQuery(theme.breakpoints.only('sm'));

  // Calculate total from ALL stats
  const totalComponents = isResetState ? 0 : stats.reduce((sum, stat) => sum + stat.count, 0);

  // Process stats for display
  const displayStats = statusOrder.map((status) => {
    const stat = stats.find(s => s.status === status) || { count: 0 };
    
    // Calculate percentage against TOTAL components (including planning)
    const percent = totalComponents > 0 
      ? ((stat.count / totalComponents) * 100).toFixed(1) 
      : 0;

    return {
      status,
      displayTitle: STATUS_THAI[status],
      count: isResetState ? 0 : stat.count,
      percent: isResetState ? 0 : percent
    };
  });

  return (
    <Box sx={{ mb: isXsScreen ? 1 : 2 }}>
      <Paper
        elevation={3}
        sx={{
          p: isXsScreen ? 1 : { xs: 1, sm: 2, md: 3 },
          mb: isXsScreen ? 1 : 3,
          borderRadius: isXsScreen ? 0 : 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
        }}
      >
        <Typography
          variant={isXsScreen ? 'subtitle1' : 'h6'}
          fontWeight={600}
          noWrap
          mb={isXsScreen ? 0.5 : 1}
        >
          โครงการ: {isResetState ? 'เลือกโครงการ' : projectName}
        </Typography>
      </Paper>
      <Grid container spacing={isXsScreen ? 0.5 : (isSmScreen ? 1 : 2)}>
        {displayStats.map((stat, i) => {
          const { bg, color } = getStatusColor(stat.status);
          return (
            <Grid item xs={2.4} sm={2.4} md={2.4} lg={2.4} xl={2.4} key={i}>
              <Box
                sx={{
                  backgroundColor: bg,
                  color: color,
                  borderRadius: isXsScreen ? 1 : 2,
                  p: isXsScreen ? 0.5 : (isSmScreen ? 1 : 1.5),
                  textAlign: 'center',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: isXsScreen ? 'none' : 'scale(1.05)',
                  },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box
                  component="img"
                  src={getStatusGif(stat.status)}
                  alt={stat.displayTitle}
                  sx={{
                    width: isXsScreen ? '20px' : (isSmScreen ? '25px' : '40px'),
                    height: isXsScreen ? '20px' : (isSmScreen ? '25px' : '40px'),
                    objectFit: 'contain',
                    margin: 'auto',
                  }}
                />
                <Typography
                  variant={isXsScreen ? 'caption' : (isSmScreen ? 'body2' : 'subtitle2')}
                  fontWeight={600}
                  align="center"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.2,
                    fontSize: isXsScreen ? '0.5rem' : (isSmScreen ? '0.7rem' : '0.9rem'),
                    mt: isXsScreen ? 0.2 : (isSmScreen ? 0.5 : 1),
                    mb: isXsScreen ? 0.2 : (isSmScreen ? 0.5 : 1),
                  }}
                >
                  {stat.displayTitle}
                </Typography>
                <Typography
                  variant={isXsScreen ? 'caption' : (isSmScreen ? 'body2' : 'h6')}
                  fontWeight={600}
                  align="center"
                  sx={{
                    fontSize: isXsScreen ? '0.6rem' : (isSmScreen ? '0.8rem' : '1rem'),
                    lineHeight: isXsScreen ? 1 : (isSmScreen ? 1.1 : 1.2),
                  }}
                >
                  {stat.percent}%
                </Typography>
                <Typography
                  variant={isXsScreen ? 'caption' : (isSmScreen ? 'caption' : 'body2')}
                  align="center"
                  sx={{
                    fontSize: isXsScreen ? '0.4rem' : (isSmScreen ? '0.5rem' : '0.7rem'),
                    mb: isXsScreen ? 0.2 : (isSmScreen ? 0.5 : 0.5),
                  }}
                >
                  ({stat.count})
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default TopCards;