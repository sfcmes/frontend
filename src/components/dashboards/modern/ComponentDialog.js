import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  IconButton,
  Fade,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  Close as CloseIcon, 
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon 
} from '@mui/icons-material';
import {
  fetchComponentById,
  fetchUserProfile,
  updateComponentStatus,
  fetchUserById,
  fetchComponentFiles,
  openFile,
  fetchUserProjects,
  getProjectIdFromSectionId,
} from 'src/utils/api';
import ComponentDetails from './ComponentDetails';
import FileManagement from './FileManagement';

// Constants
const STATUS_DISPLAY_MAP = {
  planning: 'แผนผลิต',
  manufactured: 'ผลิตแล้ว',
  transported: 'ขนส่งสำเร็จ',
  accepted: 'ตรวจรับแล้ว',
  installed: 'ติดตั้งแล้ว',
  rejected: 'ถูกปฏิเสธ',
};

const STATUS_COLORS = {
  planning: '#64b5f6',
  manufactured: '#82ca9d',
  transported: '#ffc658',
  accepted: '#8e44ad',
  installed: '#27ae60',
  rejected: '#ff6b6b',
};

// Caches
const userCache = new Map();
const componentCache = new Map();

const ComponentDialog = memo(
  ({
    open,
    onClose,
    component,
    projectCode,
    onComponentUpdate,
    canEdit: initialCanEdit,
    userRole,
    preventAutoClose = false,
  }) => {
    const [hasEditPermission, setHasEditPermission] = useState(false);

    // State management
    const [state, setState] = useState({
      tabValue: 0,
      componentDetails: null,
      componentFiles: [],
      loading: true,
      error: null,
      userRole: '',
      isAuthenticated: false,
      newStatus: '',
      isUpdating: false,
      snackbarOpen: false,
      snackbarMessage: '',
      lastFetchTime: null,
      // เพิ่ม state สำหรับการแสดงผลอัพเดท
      updateSuccess: false,
      showUpdateResult: false,
      lastUpdatedStatus: null,
      isRefreshingData: false,
    });

    const [selectedFiles, setSelectedFiles] = useState([]);

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const fileInputRef = useRef(null);
    
    // Use ref to prevent auto-close during parent re-renders
    const dialogStateRef = useRef({
      isOpen: false,
      preventClose: false
    });
    
    // Update dialog state ref when open prop changes
    useEffect(() => {
      if (open && !dialogStateRef.current.isOpen) {
        console.log('ComponentDialog opening, setting preventClose flag');
        dialogStateRef.current = {
          isOpen: true,
          preventClose: true
        };
      } else if (!open && dialogStateRef.current.isOpen) {
        console.log('ComponentDialog closing, clearing preventClose flag');
        dialogStateRef.current = {
          isOpen: false,
          preventClose: false
        };
      }
    }, [open]);

    // เพิ่ม function สำหรับ refresh ข้อมูล
    const refreshComponentData = useCallback(async () => {
      if (!component?.id) return;

      setState(prev => ({ ...prev, isRefreshingData: true }));

      try {
        const [updatedDetails, updatedFiles] = await Promise.all([
          fetchComponentById(component.id),
          fetchComponentFiles(component.id),
        ]);

        // Process history with user data
        let processedDetails = updatedDetails;
        if (state.isAuthenticated && updatedDetails.history) {
          const uniqueUserIds = [...new Set(updatedDetails.history.map((item) => item.updated_by))];

          const userFetchPromises = uniqueUserIds.map(async (userId) => {
            if (userCache.has(userId)) {
              return userCache.get(userId);
            }
            try {
              const userData = await fetchUserById(userId);
              userCache.set(userId, userData);
              return userData;
            } catch (error) {
              console.warn(`Failed to fetch user ${userId}`, error);
              return { id: userId, username: 'Unknown' };
            }
          });

          const users = await Promise.all(userFetchPromises);
          const userMap = new Map(users.map((user) => [user.id, user]));

          processedDetails = {
            ...updatedDetails,
            history: updatedDetails.history.map((item) => ({
              ...item,
              username: userMap.get(item.updated_by)?.username || 'Unknown',
            })),
          };
        }

        // Update cache
        componentCache.set(component.id, {
          details: processedDetails,
          timestamp: Date.now(),
        });

        setState(prev => ({
          ...prev,
          componentDetails: processedDetails,
          componentFiles: updatedFiles,
          newStatus: processedDetails.status,
          isRefreshingData: false,
        }));

        return processedDetails;
      } catch (error) {
        console.error('Error refreshing component data:', error);
        setState(prev => ({ 
          ...prev, 
          isRefreshingData: false,
          snackbarMessage: 'ไม่สามารถรีเฟรชข้อมูลได้',
          snackbarOpen: true 
        }));
        return null;
      }
    }, [component?.id, state.isAuthenticated]);

    // Handler สำหรับการอัพเดท component (รวม logic ทั้งหมด)
    const handleComponentUpdate = useCallback(
      (updatedComponent) => {
        // ถ้าเป็น null หมายถึงการลบ component
        if (updatedComponent === null) {
          // ส่งต่อการลบไปยัง parent และปิด dialog
          onComponentUpdate?.(null);
          onClose();
          return;
        }

        // อัพเดท state ภายใน dialog
        setState((prev) => ({
          ...prev,
          componentDetails: updatedComponent,
          componentFiles: updatedComponent.files || prev.componentFiles,
          newStatus: updatedComponent.status, // อัพเดท newStatus ด้วย
        }));

        // ส่งต่อการอัพเดทไปยัง parent component
        onComponentUpdate?.(updatedComponent);
      },
      [onComponentUpdate, onClose],
    );

    // Permission checking
    useEffect(() => {
      const checkPermissions = async () => {
        try {
          const userProfile = await fetchUserProfile();
          console.log('Checking permissions for user:', userProfile);

          setState((prev) => ({ ...prev, userRole: userProfile.role }));

          if (userProfile.role === 'Admin') {
            setHasEditPermission(true);
            return;
          }

          let projectId = component?.project_id;

          if (!projectId && component?.section_id) {
            try {
              projectId = await getProjectIdFromSectionId(component.section_id);
              console.log('Got project ID from section:', projectId);
            } catch (error) {
              console.error('Error getting project ID from section:', error);
              setHasEditPermission(false);
              return;
            }
          }

          if (!projectId) {
            console.log('No project ID found');
            setHasEditPermission(false);
            return;
          }

          const userProjects = await fetchUserProjects(userProfile.id);
          console.log('User projects:', userProjects);

          if (!Array.isArray(userProjects?.data)) {
            console.log('No valid user projects data');
            setHasEditPermission(false);
            return;
          }

          const hasAccess = userProjects.data.some(
            (project) => project.project_id?.toString() === projectId?.toString(),
          );

          console.log('Permission check:', {
            hasAccess,
            userProjects: userProjects?.data,
            projectId,
          });

          setHasEditPermission(hasAccess);
        } catch (error) {
          console.error('Error checking permissions:', error);
          setHasEditPermission(false);
        }
      };

      if (open) {
        checkPermissions();
      }
    }, [open, component?.project_id, component?.section_id]);

    // File handlers
    const handleFileOpen = useCallback(async (fileUrl) => {
      try {
        await openFile(fileUrl);
      } catch (error) {
        console.error('Error opening file:', error);
        setState((prev) => ({
          ...prev,
          snackbarMessage: 'ไม่สามารถเปิดไฟล์ได้',
          snackbarOpen: true,
        }));
      }
    }, []);

    const handleFileSelect = useCallback((event) => {
      const files = Array.from(event.target.files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
    }, []);

    const handleFileInputClick = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    // Handlers
    const handleSnackbarClose = useCallback(() => {
      setState((prev) => ({ ...prev, snackbarOpen: false }));
    }, []);

    const showSnackbar = useCallback((message) => {
      setState((prev) => ({
        ...prev,
        snackbarMessage: message,
        snackbarOpen: true,
      }));
    }, []);

    const handleTabChange = useCallback((event, newValue) => {
      setState((prev) => ({ ...prev, tabValue: newValue }));
    }, []);

    const handleStatusChange = useCallback((event) => {
      setState((prev) => ({ ...prev, newStatus: event.target.value }));
    }, []);

    // ปรับปรุง handleStatusUpdate ให้ไม่ปิด dialog และแสดงผลการอัพเดท
    const handleStatusUpdate = useCallback(async () => {
      if (!hasEditPermission && state.userRole !== 'Admin') {
        showSnackbar('คุณไม่มีสิทธิ์ในการอัพเดทสถานะ');
        return;
      }

      const previousStatus = state.componentDetails?.status;
      setState((prev) => ({ ...prev, isUpdating: true, showUpdateResult: false }));

      try {
        if (!state.newStatus) {
          throw new Error('กรุณาเลือกสถานะ');
        }

        if (!component?.id) {
          throw new Error('ไม่พบรหัสชิ้นงาน');
        }

        // ส่ง API อัพเดทสถานะ
        const response = await updateComponentStatus(component.id, state.newStatus);

        if (response) {
          // แสดงผลการอัพเดทสำเร็จทันที
          setState((prev) => ({
            ...prev,
            updateSuccess: true,
            showUpdateResult: true,
            lastUpdatedStatus: state.newStatus,
            isUpdating: false,
          }));

          // รีเฟรชข้อมูลในพื้นหลัง
          const updatedDetails = await refreshComponentData();
          
          if (updatedDetails && onComponentUpdate) {
            onComponentUpdate(updatedDetails);
          }

          // แสดง Snackbar ยืนยัน
          showSnackbar(
            `อัพเดทสถานะจาก "${STATUS_DISPLAY_MAP[previousStatus] || previousStatus}" เป็น "${STATUS_DISPLAY_MAP[state.newStatus]}" เรียบร้อยแล้ว`
          );
          
          // ซ่อนผลการอัพเดทหลัง 5 วินาที
          setTimeout(() => {
            setState((prev) => ({ ...prev, showUpdateResult: false }));
          }, 5000);

          // *** ไม่ปิด Dialog ให้ user ทำงานต่อได้ ***
        }
      } catch (error) {
        console.error('Error updating status:', error);
        setState((prev) => ({
          ...prev,
          updateSuccess: false,
          showUpdateResult: true,
          isUpdating: false,
        }));
        showSnackbar(error.message || 'ไม่สามารถอัพเดทสถานะได้ กรุณาลองใหม่');
        
        // ซ่อนผลการอัพเดทหลัง 5 วินาที
        setTimeout(() => {
          setState((prev) => ({ ...prev, showUpdateResult: false }));
        }, 5000);
      }
    }, [component?.id, state.newStatus, hasEditPermission, onComponentUpdate, showSnackbar, refreshComponentData, state.componentDetails?.status]);

    // Data fetching with cache
    useEffect(() => {
      if (!open || !component?.id) return;

      const abortController = new AbortController();
      const signal = abortController.signal;

      const CACHE_DURATION = 30000; // 30 seconds cache
      const cached = componentCache.get(component.id);
      const now = Date.now();

      const fetchData = async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
          if (cached && now - cached.timestamp < CACHE_DURATION) {
            const [files, userProfile] = await Promise.all([
              fetchComponentFiles(component.id, { signal }),
              fetchUserProfile().catch(() => null),
            ]);

            if (!signal.aborted) {
              setState((prev) => ({
                ...prev,
                componentDetails: cached.details,
                componentFiles: files,
                loading: false,
                isAuthenticated: !!userProfile,
                userRole: userProfile?.role || '',
                newStatus: cached.details.status,
                lastFetchTime: cached.timestamp,
              }));
              return;
            }
          }

          const [details, files, userProfile] = await Promise.all([
            fetchComponentById(component.id, { signal }),
            fetchComponentFiles(component.id, { signal }),
            fetchUserProfile().catch(() => null),
          ]);

          const isAuthenticated = !!userProfile;
          const userRole = userProfile?.role || '';

          let processedDetails = details;
          if (isAuthenticated && details.history) {
            const uniqueUserIds = [...new Set(details.history.map((item) => item.updated_by))];

            const userFetchPromises = uniqueUserIds.map(async (userId) => {
              if (userCache.has(userId)) {
                return userCache.get(userId);
              }
              try {
                const userData = await fetchUserById(userId);
                userCache.set(userId, userData);
                return userData;
              } catch (error) {
                console.warn(`Failed to fetch user ${userId}`, error);
                return { id: userId, username: 'Unknown' };
              }
            });

            const users = await Promise.all(userFetchPromises);
            const userMap = new Map(users.map((user) => [user.id, user]));

            processedDetails = {
              ...details,
              history: details.history.map((item) => ({
                ...item,
                username: userMap.get(item.updated_by)?.username || 'Unknown',
              })),
            };
          }

          componentCache.set(component.id, {
            details: processedDetails,
            timestamp: now,
          });

          if (!signal.aborted) {
            setState((prev) => ({
              ...prev,
              componentDetails: processedDetails,
              componentFiles: files,
              loading: false,
              isAuthenticated,
              userRole,
              newStatus: processedDetails.status,
              lastFetchTime: now,
            }));
          }
        } catch (error) {
          if (!signal.aborted) {
            console.error('Error fetching data:', error);
            setState((prev) => ({
              ...prev,
              error: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่',
              loading: false,
            }));
          }
        }
      };

      fetchData();

      return () => {
        abortController.abort();
      };
    }, [open, component?.id]);

    // Early returns
    if (!open) return null;

    if (state.loading) {
      return (
        <Dialog open={open} onClose={onClose}>
          <DialogContent>
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
              <CircularProgress />
            </Box>
          </DialogContent>
        </Dialog>
      );
    }

    if (state.error) {
      return (
        <Dialog open={open} onClose={onClose}>
          <DialogContent>
            <Alert severity="error">{state.error}</Alert>
          </DialogContent>
        </Dialog>
      );
    }

    // Render tab content
    const renderTabContent = () => {
      switch (state.tabValue) {
        case 0:
          return (
            <ComponentDetails
              componentId={component.id}
              componentDetails={state.componentDetails}
              userRole={state.userRole}
              onUpdate={(updatedDetails) => {
                // *** แก้ไขตรงนี้: ไม่ปิด dialog เมื่ออัพเดทรายละเอียด ***
                // เฉพาะเมื่อลบ component เท่านั้นที่จะปิด
                handleComponentUpdate(updatedDetails);
              }}
              setSnackbarMessage={showSnackbar}
              setSnackbarOpen={(open) => setState((prev) => ({ ...prev, snackbarOpen: open }))}
              canEdit={hasEditPermission}
              onClose={onClose}
            />
          );
        case 1:
          return (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  ประวัติสถานะ
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={state.isRefreshingData ? <CircularProgress size={16} /> : <RefreshIcon />}
                  onClick={refreshComponentData}
                  disabled={state.isRefreshingData}
                >
                  {state.isRefreshingData ? 'กำลังรีเฟรช...' : 'รีเฟรช'}
                </Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>วันที่อัพเดต</TableCell>
                    <TableCell>อัพเดตโดย</TableCell>
                    <TableCell>หมายเหตุ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.componentDetails?.history?.map((historyItem, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip
                          label={STATUS_DISPLAY_MAP[historyItem.status] || historyItem.status}
                          size="small"
                          sx={{
                            bgcolor: STATUS_COLORS[historyItem.status] || '#grey',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(historyItem.updated_at).toLocaleString('th-TH')}
                      </TableCell>
                      <TableCell>{historyItem.username}</TableCell>
                      <TableCell>{historyItem.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          );
        case 2:
          return (
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                ไฟล์ที่เกี่ยวข้อง
              </Typography>
              <List>
                {state.componentFiles.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={file.file_name || `Revision ${file.revision}`}
                      secondary={new Date(file.created_at).toLocaleString('th-TH')}
                    />
                    <Button onClick={() => handleFileOpen(file.s3_url)}>เปิดไฟล์</Button>
                  </ListItem>
                ))}
              </List>
              {state.componentFiles.length === 0 && <Typography>ไม่มีไฟล์ที่เกี่ยวข้อง</Typography>}
            </Box>
          );
        case 3:
          return (
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                อัพเดทสถานะ
              </Typography>
              
              {/* แสดงสถานะปัจจุบัน */}
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  สถานะปัจจุบัน:
                </Typography>
                <Chip
                  label={STATUS_DISPLAY_MAP[state.componentDetails?.status] || state.componentDetails?.status}
                  sx={{
                    bgcolor: STATUS_COLORS[state.componentDetails?.status] || '#grey',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>

              {state.userRole === 'Admin' || hasEditPermission ? (
                <>
                  <Select
                    value={state.newStatus || ''}
                    onChange={handleStatusChange}
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={state.isUpdating}
                  >
                    {Object.entries(STATUS_DISPLAY_MAP).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            width={12}
                            height={12}
                            borderRadius="50%"
                            bgcolor={STATUS_COLORS[value]}
                          />
                          {label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  
                  <Box display="flex" flexDirection="column" gap={2} mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleStatusUpdate}
                      disabled={state.isUpdating || !state.newStatus || state.newStatus === state.componentDetails?.status}
                      startIcon={state.isUpdating ? <CircularProgress size={16} /> : null}
                      size="large"
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {state.isUpdating ? 'กำลังอัพเดท...' : 'อัพเดทสถานะ'}
                    </Button>

                    {/* แสดงผลการอัพเดทแบบโดดเด่น */}
                    <Fade in={state.showUpdateResult}>
                      <Box>
                        {state.updateSuccess ? (
                          <Alert 
                            severity="success" 
                            icon={<CheckCircleIcon />}
                            sx={{ 
                              '& .MuiAlert-message': { 
                                fontSize: '1rem',
                                fontWeight: 'bold'
                              }
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle1" component="div">
                                ✅ อัพเดทสถานะสำเร็จ!
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                สถานะได้เปลี่ยนเป็น "{STATUS_DISPLAY_MAP[state.lastUpdatedStatus]}" แล้ว
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                คุณสามารถดูประวัติในแท็บ "ประวัติสถานะ" หรือทำงานต่อได้
                              </Typography>
                            </Box>
                          </Alert>
                        ) : (
                          <Alert severity="error">
                            <Typography variant="subtitle1" component="div">
                              ❌ อัพเดทไม่สำเร็จ
                            </Typography>
                            <Typography variant="body2">
                              กรุณาลองใหม่อีกครั้ง
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    </Fade>
                  </Box>

                  {/* แสดงคำแนะนำ */}
                  {state.newStatus === state.componentDetails?.status && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      สถานะที่เลือกเหมือนกับสถานะปัจจุบัน
                    </Alert>
                  )}
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  คุณไม่มีสิทธิ์ในการอัพเดทสถานะสำหรับโปรเจคนี้
                </Alert>
              )}
            </Box>
          );
        case 4:
          return hasEditPermission ? (
            <Box position="relative">
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                multiple
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<AttachFileIcon />}
                onClick={handleFileInputClick}
                sx={{ mb: 2 }}
              >
                อัพโหลดไฟล์
              </Button>

              {selectedFiles.length > 0 && (
                <Box mt={2} mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    ไฟล์ที่เลือก:
                  </Typography>
                  <List dense>
                    {selectedFiles.map((file, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => {
                              setSelectedFiles((files) => files.filter((_, i) => i !== index));
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <FileManagement
                componentId={component.id}
                setSnackbarMessage={showSnackbar}
                setSnackbarOpen={(open) => setState((prev) => ({ ...prev, snackbarOpen: open }))}
                onComponentUpdate={handleComponentUpdate}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
              />
            </Box>
          ) : null;
        default:
          return null;
      }
    };

    return (
      <>
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="md"
          fullWidth
          TransitionProps={{
            onExited: () => setState((prev) => ({ 
              ...prev, 
              tabValue: 0,
              showUpdateResult: false,
              updateSuccess: false 
            })),
          }}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">รายละเอียด: {state.componentDetails?.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  สถานะ: {STATUS_DISPLAY_MAP[state.componentDetails?.status] || state.componentDetails?.status}
                </Typography>
              </Box>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Tabs
              value={state.tabValue}
              onChange={handleTabChange}
              variant={isSmallScreen ? 'scrollable' : 'standard'}
              scrollButtons={isSmallScreen ? 'auto' : 'auto'}
              allowScrollButtonsMobile
            >
              <Tab label="รายละเอียดชิ้นงาน" />
              <Tab 
                label="ประวัติสถานะ" 
                icon={state.isRefreshingData ? <CircularProgress size={16} /> : null}
                iconPosition="end"
              />
              <Tab label="ไฟล์" />
              {(state.userRole === 'Admin' || hasEditPermission) && <Tab label="อัพเดทสถานะ" />}
              {hasEditPermission && <Tab label="จัดการไฟล์" />}
            </Tabs>
            <Box sx={{ mt: 2 }}>{renderTabContent()}</Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {state.showUpdateResult && state.updateSuccess ? 
                '💡 หน้าต่างจะไม่ปิดอัตโนมัติ คุณสามารถทำงานต่อหรือปิดด้วยตนเองได้' : 
                'คลิก "ปิด" เพื่อกลับไปหน้าหลัก'
              }
            </Typography>
            <Button onClick={onClose} color="primary" variant="outlined" size="large">
              ปิด
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={state.snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
            {state.snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    );
  },
);

export default ComponentDialog;
