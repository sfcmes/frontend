import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconButton,
  Box,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import * as dropdownData from './data';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';

import { IconBellRinging } from '@tabler/icons';
import { Stack } from '@mui/system';

const Notifications = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);

  const handleClick2 = (event) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  return (
    <></>
  );
};

export default Notifications;
