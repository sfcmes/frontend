import React, { useState } from 'react';
import { sum } from 'lodash';
import { IconShoppingCart, IconX } from '@tabler/icons';
import { Box, Typography, Badge, Drawer, IconButton, Button, Stack } from '@mui/material';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import CartItems from './CartItems';

const Cart = () => {
  // Get Products
  const Cartproduct = useSelector((state) => state.ecommerceReducer.cart);
  const bcount = Cartproduct.length > 0 ? Cartproduct.length : '0';

  const checkout = useSelector((state) => state.ecommerceReducer.cart);
  const total = sum(checkout.map((product) => product.price * product.qty));

  const [showDrawer, setShowDrawer] = useState(false);
  const handleDrawerClose = () => {
    setShowDrawer(false);
  };

  const cartContent = (
    <Box>
      {/* ------------------------------------------- */}
      {/* Cart Content */}
      {/* ------------------------------------------- */}
      <Box>
        <CartItems />
      </Box>
    </Box>
  );

  return (
    <></>
  );
};

export default Cart;
