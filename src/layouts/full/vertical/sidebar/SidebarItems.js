import React from 'react';
import Menuitems from './MenuItems';
import { useLocation } from 'react-router';
import { Box, List, useMediaQuery } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { toggleMobileSidebar } from 'src/store/customizer/CustomizerSlice';
import NavItem from './NavItem';
import NavCollapse from './NavCollapse';
import NavGroup from './NavGroup/NavGroup';
import { useAuth } from 'src/contexts/AuthContext'; // Import the AuthContext

const SidebarItems = () => {
  const { pathname } = useLocation();
  const pathDirect = pathname;
  const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf('/'));
  const customizer = useSelector((state) => state.customizer);
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
  const dispatch = useDispatch();
  const { user } = useAuth(); // Get the user from AuthContext

  // Filter menu items based on user authentication status and role
  const filteredMenuItems = React.useMemo(() => {
    if (!user) {
      // Non-authenticated users
      return Menuitems.filter(item => 
        item.href === '/dashboards/modern' || 
        (item.title === 'Login' && item.href === '/auth/login')
      );
    } else if (user.role === 'Admin') {
      // Admin users can access all routes
      return Menuitems;
    } else if (user.role === 'Site User') {
      // Site Users can only access the Modern Dashboard
      return Menuitems.filter(item => item.href === '/dashboards/modern');
    } else {
      // Default case: only show Modern Dashboard
      return Menuitems.filter(item => item.href === '/dashboards/modern');
    }
  }, [user]);

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {filteredMenuItems.map((item) => {
          // {/********SubHeader**********/}
          if (item.subheader) {
            return <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />;

            // {/********If Sub Menu**********/}
            /* eslint no-else-return: "off" */
          } else if (item.children) {
            // For non-authenticated users or non-Admin users, we only want to show the main login option, not its children
            if ((!user || user.role !== 'Admin') && item.title === 'Login') {
              return (
                <NavItem
                  item={{...item, children: undefined}}
                  key={item.id}
                  pathDirect={pathDirect}
                  hideMenu={hideMenu}
                  onClick={() => dispatch(toggleMobileSidebar())}
                />
              );
            }
            return (
              <NavCollapse
                menu={item}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                pathWithoutLastPart={pathWithoutLastPart}
                level={1}
                key={item.id}
                onClick={() => dispatch(toggleMobileSidebar())}
              />
            );

            // {/********If Sub No Menu**********/}
          } else {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                onClick={() => dispatch(toggleMobileSidebar())}
              />
            );
          }
        })}
      </List>
    </Box>
  );
};

export default SidebarItems;