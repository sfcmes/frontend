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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close as CloseIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import {
  fetchComponentById,
  fetchUserProfile,
  updateComponentStatus,
  fetchUserById,
  fetchComponentFiles,
  openFile,
  fetchUserProjects, // Add this
  getProjectIdFromSectionId, // Add this
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
    canEdit: initialCanEdit, // Renamed to avoid conflict
    userRole,
  }) => {
    // Changed initialization to use initialCanEdit
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
    });

    useEffect(() => {
      const checkPermissions = async () => {
        try {
          const userProfile = await fetchUserProfile();
          console.log('Checking permissions for user:', userProfile);

          // Set user role first
          setState((prev) => ({ ...prev, userRole: userProfile.role }));

          // Admin always has permission
          if (userProfile.role === 'Admin') {
            setHasEditPermission(true);
            return;
          }

          // For Site User
          let projectId = component?.project_id;

          // Get project ID from section if not directly available
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

          // Check Site User permissions
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

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const fileInputRef = useRef(null);

    const [selectedFiles, setSelectedFiles] = useState([]);

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

    const handleStatusUpdate = useCallback(async () => {
      if (!hasEditPermission && state.userRole !== 'Admin') {
        showSnackbar('คุณไม่มีสิทธิ์ในการอัพเดทสถานะ');
        return;
      }

      setState((prev) => ({ ...prev, isUpdating: true }));

      try {
        if (!state.newStatus) {
          throw new Error('กรุณาเลือกสถานะ');
        }

        if (!component?.id) {
          throw new Error('ไม่พบรหัสชิ้นงาน');
        }

        const response = await updateComponentStatus(component.id, state.newStatus);

        if (response) {
          const updatedDetails = await fetchComponentById(component.id);

          // Update cache with new data
          componentCache.set(component.id, {
            details: updatedDetails,
            timestamp: Date.now(),
          });

          setState((prev) => ({
            ...prev,
            componentDetails: updatedDetails,
            isUpdating: false,
            lastFetchTime: Date.now(),
          }));

          showSnackbar('อัพเดทสถานะเรียบร้อยแล้ว');

          if (onComponentUpdate) {
            onComponentUpdate(updatedDetails);
          }
        }
      } catch (error) {
        console.error('Error updating status:', error);
        showSnackbar(error.message || 'ไม่สามารถอัพเดทสถานะได้ กรุณาลองใหม่');
      } finally {
        setState((prev) => ({ ...prev, isUpdating: false }));
      }
    }, [component?.id, state.newStatus, hasEditPermission, onComponentUpdate, showSnackbar]);

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
          // Check if we have valid cached data
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

          // If no cache or expired, fetch everything
          const [details, files, userProfile] = await Promise.all([
            fetchComponentById(component.id, { signal }),
            fetchComponentFiles(component.id, { signal }),
            fetchUserProfile().catch(() => null),
          ]);

          const isAuthenticated = !!userProfile;
          const userRole = userProfile?.role || '';

          // Process history with optimized user data fetching
          let processedDetails = details;
          if (isAuthenticated && details.history) {
            const uniqueUserIds = [...new Set(details.history.map((item) => item.updated_by))];

            // Fetch missing users in parallel
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

          // Update cache
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

    // แยก state สำหรับการจัดการไฟล์
    const [fileManagementState, setFileManagementState] = useState({
      selectedFiles: [],
    });

    // Handler สำหรับการอัพเดท component
    const handleComponentUpdate = useCallback(
      (updatedComponent) => {
        setState((prev) => ({
          ...prev,
          componentDetails: updatedComponent,
          componentFiles: updatedComponent.files || prev.componentFiles,
        }));

        // ส่งต่อการอัพเดทไปยัง parent component
        onComponentUpdate?.(updatedComponent);
      },
      [onComponentUpdate],
    );

    useEffect(() => {
      const checkPermissions = async () => {
        if (!component?.project_id) return;

        try {
          const userProfile = await fetchUserProfile();
          const userId = userProfile.id;

          const { canEdit: hasPermission } = await checkUserProjectPermission(
            userId,
            component.project_id,
          );

          setHasEditPermission(hasPermission);
        } catch (error) {
          console.error('Error checking permissions:', error);
          setHasEditPermission(false);
        }
      };

      if (open) {
        checkPermissions();
      }
    }, [open, component?.project_id]);

    // const canEditComponent = state.canEdit || canEdit;

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
                if (updatedDetails === null) {
                  onComponentUpdate?.(null);
                  onClose();
                } else {
                  setState((prev) => ({ ...prev, componentDetails: updatedDetails }));
                  onComponentUpdate?.(updatedDetails);
                }
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
              <Typography variant="h6" gutterBottom>
                ประวัติสถานะ
              </Typography>
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
                        {STATUS_DISPLAY_MAP[historyItem.status] || historyItem.status}
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
                      primary={`Revision ${file.revision}`}
                      secondary={new Date(file.created_at).toLocaleString('th-TH')}
                      SS
                    />
                    <Button
                      onClick={() => {
                        window.open(file.s3_url, '_blank');
                        // หรือถ้าใช้ openFile อยู่แล้ว ก็ใช้แบบนี้
                        // handleFileOpen(file.s3_url);
                      }}
                    >
                      เปิดไฟล์
                    </Button>
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
                {(state.userRole === 'Admin' || hasEditPermission) ? (
                  <>
                    <Select
                      value={state.newStatus || ''}
                      onChange={handleStatusChange}
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      {Object.entries(STATUS_DISPLAY_MAP).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleStatusUpdate}
                      disabled={state.isUpdating}
                      sx={{ mt: 2 }}
                    >
                      {state.isUpdating ? 'กำลังอัพเดท...' : 'อัพเดทสถานะ'}
                    </Button>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    คุณไม่มีสิทธิ์ในการอัพเดทสถานะสำหรับโปรเจคนี้
                  </Alert>
                )}
              </Box>
            );case 4:
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
            onExited: () => setState((prev) => ({ ...prev, tabValue: 0 })),
          }}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">รายละเอียด: {state.componentDetails?.name}</Typography>
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
              <Tab label="ประวัติสถานะ" />
              <Tab label="ไฟล์" />
              {(state.userRole === 'Admin' || hasEditPermission) && <Tab label="อัพเดทสถานะ" />}
              {hasEditPermission && <Tab label="จัดการไฟล์" />}
            </Tabs>
            <Box sx={{ mt: 2 }}>{renderTabContent()}</Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="primary">
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

// PropTypes validation could be added here if needed

export default ComponentDialog;
