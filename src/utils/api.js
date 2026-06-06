import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sfcpcbackend.ngrok.app/api';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://54.251.182.137:3000/api'
// const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is important for cookies to be sent with requests
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        api
          .post('/auth/refresh', {
            refreshToken: localStorage.getItem('refreshToken'),
          })
          .then(({ data }) => {
            api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token;
            originalRequest.headers['Authorization'] = 'Bearer ' + data.token;
            processQueue(null, data.token);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  },
);
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.setToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

const uploadFileToS3 = async (file, componentId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('componentId', componentId); // Send component ID

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.fileUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

const createComponent = async (formData) => {
  try {
    const response = await api.post('/components', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Error creating component:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
};

// Authentication API
const loginUser = async (data) => {
  try {
    const response = await api.post('/auth/login', data);
    if (response.data && response.data.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      // Store refresh token in localStorage (consider more secure options in production)
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
    return {
      success: false,
      error: error.response
        ? error.response.data.message
        : 'An unexpected error occurred. Please try again.',
    };
  }
};

const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    const response = await api.get('/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('User profile:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    throw error;
  }
};

const registerUser = (data) => api.post('/users', data);

const fetchRoles = () => api.get('/users/roles');

const updateUserProfile = (data) => api.put('/users/me', data);
const updateUserById = (userId, data) => api.put(`/users/${userId}`, data);
const deleteUserById = (userId) => api.delete(`/users/${userId}`);

const fetchProjects = async () => {
  try {
    // Use regular projects endpoint since it's now public
    const response = await publicApi.get('/projects');
    console.log('Fetched projects:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return { data: [] }; // Return empty array instead of throwing error
  }
};


const logoutUser = async () => {
  try {
    // Optionally, if you have a server-side logout endpoint:
    // await api.post('/auth/logout');

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Failed to logout' };
  }
};

const fetchProjectById = (projectId) => api.get(`/projects/${projectId}`);
const createProject = (data) => api.post('/projects', data);
const updateProject = (projectId, data) => api.put(`/projects/${projectId}`, data);

const fetchSectionsByProjectId = (projectId) => api.get(`/sections/projects/${projectId}/sections`);
const fetchSectionById = (sectionId) => api.get(`/sections/${sectionId}`);
const createSection = (data) => api.post('/sections', data);
const updateSection = (sectionId, data) => api.put(`/sections/${sectionId}`, data);
const deleteSection = (sectionId) => api.delete(`/sections/${sectionId}`);

const fetchComponentsBySectionId = (sectionId) => api.get(`/components/section/${sectionId}`);
const fetchComponentsByProjectId = async (projectId) => {
  try {
    const response = await publicApi.get(`/components/project/${projectId}`);
    console.log('API response:', response);
    return response.data;
  } catch (error) {
    console.log(`No components found for project ${projectId}`);
    // Return empty arrays instead of throwing error
    return { precast: [], other: [] };
  }
};

const addComponentHistory = async (data) => {
  try {
    const response = await api.post('/components/componentHistory', data);
    console.log('Component history added successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding component history:', error.response ? error.response.data : error);
    throw error;
  }
};

const updateComponent = async (componentId, data) => {
  try {
    const response = await api.put(`/components/${componentId}`, data);
    console.log('Update component response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating component:', error);
    throw error;
  }
};
// const deleteComponent = (componentId) => api.delete(`/components/${componentId}`);

// const fetchComponentById = async (componentId) => {
//   try {
//     const response = await api.get(`/components/${componentId}`);
//     console.log('Fetched component details:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching component details:', error);
//     throw error;
//   }
// };
const fetchComponentById = async (componentId) => {
  try {
    const response = await publicApi.get(`/components/${componentId}`);
    console.log('Fetched component details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching component details:', error);
    throw error;
  }
};
const fetchUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

const downloadFile = async (fileUrl) => {
  try {
    const response = await api.get(`/download?url=${encodeURIComponent(fileUrl)}`, {
      responseType: 'blob', // Important: This tells Axios to treat the response as binary data
    });

    // Create a new Blob object using the response data as a Uint8Array
    const blob = new Blob([response.data]);

    // Create a link element, set the download attribute, and click it
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'document.pdf'; // You can set a default name or use the one from the server if available
    link.click();

    // Clean up by revoking the Object URL
    window.URL.revokeObjectURL(link.href);

    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

const openFile = async (fileUrl) => {
  try {
    const response = await api.get(`/download?url=${encodeURIComponent(fileUrl)}`, {
      responseType: 'blob', // Important: This tells Axios to treat the response as binary data
    });

    // Create a new Blob object using the response data
    const blob = new Blob([response.data], { type: response.headers['content-type'] });

    // Create a URL for the blob
    const fileObjectUrl = window.URL.createObjectURL(blob);

    // Open the file in a new tab
    window.open(fileObjectUrl, '_blank');

    // Clean up by revoking the Object URL after a short delay
    setTimeout(() => window.URL.revokeObjectURL(fileObjectUrl), 1000);

    return true;
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
};

const fetchSectionByName = async (projectId, sectionName) => {
  try {
    const response = await api.get(`/sections/projects/${projectId}/sections`, {
      params: { name: sectionName },
    });
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error fetching section by name:', error);
    throw error;
  }
};

const checkUsername = async (username) => {
  try {
    const response = await publicApi.post('/users/check-username', { username });
    return response.data.isValid;
  } catch (error) {
    console.error('Error checking username:', error);
    throw error;
  }
};

const updateComponentStatus = async (componentId, newStatus, username) => {
  try {
    let response;
    if (username) {
      // Public API call with username
      response = await publicApi.put(`/components/${componentId}/status`, { status: newStatus, username });
    } else {
      // Authenticated API call
      response = await api.put(`/components/${componentId}/status-auth`, { status: newStatus });
    }
    console.log('Updated component status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating component status:', error);
    throw error;
  }
};

const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Fetch all file revisions for a component
export const fetchComponentFiles = async (componentId) => {
  try {
    const response = await api.get(`/components/${componentId}/files`);
    return response.data;
  } catch (error) {
    console.error('Error fetching component files:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch component files');
  }
};

// Update a specific file revision
export const updateFileRevision = async (componentId, revision, file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await api.put(`/components/${componentId}/files/${revision}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating file revision:', error);
    throw error;
  }
};

// Delete a specific file revision
const deleteFileRevision = async (componentId, revision) => {
  try {
    const response = await api.delete(`/components/${componentId}/files/${revision}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting file revision:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to delete file revision');
    } else {
      throw new Error('Network error occurred while deleting file revision');
    }
  }
};

export const updateComponentWithFile = async (componentId, formData) => {
  try {
    const response = await axios.put(`/api/components/${componentId}/updateWithFile`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating component with file:', error);
    throw error;
  }
};

const uploadComponentFile = async (file, componentId) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post(`/components/${componentId}/upload-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('File upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading component file:', error);
    throw error;
  }
};

const createOtherComponent = async (data) => {
  try {
    const response = await api.post('/other-components', data);
    console.log('Created other component:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating other component:', error);
    throw error;
  }
};

const fetchOtherComponentsByProjectId = async (projectId) => {
  try {
    const response = await api.get(`/components/other/project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching other components:', error);
    throw error;
  }
};

const updateOtherComponent = async (componentId, data) => {
  try {
    const response = await api.put(`/components/other/${componentId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating other component:', error);
    throw error;
  }
};

const deleteOtherComponent = async (componentId) => {
  try {
    await api.delete(`/components/other/${componentId}`);
  } catch (error) {
    console.error('Error deleting other component:', error);
    throw error;
  }
};

const createPrecastComponent = async (formData) => {
  try {
    const response = await api.post('/components/precast', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating precast component:', error);
    if (error.response && error.response.data) {
      console.error('Error response data:', error.response.data);
      throw new Error(
        error.response.data.error ||
          error.response.data.details ||
          'Failed to create precast component',
      );
    }
    throw new Error('Failed to create precast component');
  }
};

const fetchProjectsWithOtherComponents = async () => {
  try {
    const response = await publicApi.get('/other-components/projects-with-other-components');
    console.log('Fetched projects with other components:', response.data);
    // ตรวจสอบโครงสร้างข้อมูล
    if (Array.isArray(response.data)) {
      return response.data.map(project => ({
        ...project,
        components: Array.isArray(project.components) ? project.components : []
      }));
    } else {
      console.error('Invalid data structure received from API');
      return [];
    }
  } catch (error) {
    console.error('Error fetching projects with other components:', error.response?.data || error.message);
    if (error.response && error.response.status === 500) {
      throw new Error('Server error occurred. Please try again later.');
    }
    throw error;
  }
};

// const updateOtherComponentStatus = async (componentId, fromStatus, toStatus, quantity, userId) => {
//   const client = await db.getClient();

//   try {
//     await client.query("BEGIN");

//     const fromStatusId = await getStatusIdByName(fromStatus);
//     const toStatusId = await getStatusIdByName(toStatus);

//     // Fetch the total quantity of the component
//     const { rows: [component] } = await client.query(
//       "SELECT total_quantity FROM other_components WHERE id = $1",
//       [componentId]
//     );
//     const totalQuantity = component.total_quantity;

//     // Fetch current quantities for all statuses
//     const { rows: currentStatuses } = await client.query(
//       `SELECT ocs.name, ocst.quantity 
//        FROM other_component_status_tracking ocst 
//        JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
//        WHERE ocst.other_component_id = $1`,
//       [componentId]
//     );

//     const currentQuantities = currentStatuses.reduce((acc, status) => {
//       acc[status.name] = status.quantity;
//       return acc;
//     }, {});

//     // Calculate total quantity excluding 'manufactured' and 'transported'
//     const totalExcludingManufacturedAndTransported = Object.entries(currentQuantities)
//       .filter(([status]) => status !== 'manufactured' && status !== 'transported')
//       .reduce((sum, [, value]) => sum + value, 0);

//     // Check if the update would exceed 100% for statuses other than 'manufactured' and 'transported'
//     if (toStatus !== 'manufactured' && toStatus !== 'transported') {
//       if (totalExcludingManufacturedAndTransported - (fromStatus !== 'manufactured' && fromStatus !== 'transported' ? quantity : 0) + quantity > totalQuantity) {
//         throw new Error("Update would exceed 100% of total quantity");
//       }
//     }

//     // Decrease quantity in the 'from' status, except when it's 'manufactured' or 'transported'
//     if (fromStatus !== 'manufactured' && fromStatus !== 'transported') {
//       await client.query(
//         `UPDATE other_component_status_tracking
//          SET quantity = quantity - $1
//          WHERE other_component_id = $2 AND status_id = $3`,
//         [quantity, componentId, fromStatusId]
//       );
//     }

//     // Increase quantity in the 'to' status
//     if (toStatus === 'manufactured' || toStatus === 'transported') {
//       // For 'manufactured' and 'transported', allow exceeding 100% but cap at 100%
//       const currentToQuantity = currentQuantities[toStatus] || 0;
//       const newQuantity = Math.min(currentToQuantity + quantity, totalQuantity);
//       const actualIncrease = newQuantity - currentToQuantity;

//       await client.query(
//         `INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by)
//          VALUES ($1, $2, $3, $4)
//          ON CONFLICT (other_component_id, status_id) 
//          DO UPDATE SET quantity = LEAST(other_component_status_tracking.quantity + $3, $5)`,
//         [componentId, toStatusId, actualIncrease, userId, totalQuantity]
//       );

//       // If moving from 'manufactured' to 'transported'
//       if (fromStatus === 'manufactured' && toStatus === 'transported') {
//         // Check if there's enough quantity in 'manufactured' to move
//         if (currentQuantities['manufactured'] < quantity) {
//           throw new Error("Cannot transport more than manufactured quantity");
//         }
//         // We don't update 'manufactured' quantity here, it remains unchanged
//       }
//     } else {
//       // For other statuses, just add the quantity
//       await client.query(
//         `INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by)
//          VALUES ($1, $2, $3, $4)
//          ON CONFLICT (other_component_id, status_id) 
//          DO UPDATE SET quantity = other_component_status_tracking.quantity + $3`,
//         [componentId, toStatusId, quantity, userId]
//       );
//     }

//     // Fetch updated component data
//     const { rows: [updatedComponent] } = await client.query(
//       "SELECT * FROM other_components WHERE id = $1",
//       [componentId]
//     );

//     // Fetch updated statuses
//     const { rows: statuses } = await client.query(
//       `SELECT ocs.name, ocst.quantity 
//        FROM other_component_status_tracking ocst 
//        JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
//        WHERE ocst.other_component_id = $1`,
//       [componentId]
//     );

//     await client.query("COMMIT");

//     return {
//       ...updatedComponent,
//       statuses: statuses.reduce((acc, status) => ({ ...acc, [status.name]: status.quantity }), {})
//     };
//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error('Error in updateOtherComponentStatus:', error);
//     throw error;
//   } finally {
//     client.release();
//   }
// };

const updateOtherComponentStatus = async (componentId, fromStatus, toStatus, quantity) => {
  try {
    const response = await api.put(`/other-components/${componentId}/status`, {
      fromStatus,
      toStatus,
      quantity
    });
    return response.data;
  } catch (error) {
    console.error('Error updating other component status:', error);
    throw error;
  }
};

const fetchUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

const updateUserPassword = async (userId, newPassword) => {
  try {
    const response = await api.put(`/users/${userId}/password`, { password: newPassword });
    return response.data;
  } catch (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
};

const createComponentsBatch = async (data) => {
  try {
    const response = await api.post('/components/batch', data);
    return response.data;
  } catch (error) {
    console.error('Error creating components batch:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
};

const fetchComponentByQR = async (id, isAuthenticated = false) => {
  try {
    const axiosInstance = isAuthenticated ? api : publicApi;
    const response = await axiosInstance.get(`/components/qr/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching component by QR:', error);
    throw error;
  }
};

const fetchProjectDetailsByComponentId = async (componentId) => {
  try {
    const response = await publicApi.get(`/components/${componentId}/project-details`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};

const checkAuthToken = async () => {
  try {
    const response = await api.get('/auth/check-token');
    return response.data.isValid;
  } catch (error) {
    console.error('Error checking auth token:', error);
    return false;
  }
};

const deleteProjectImage = async (projectId, imageId) => {
  try {
    const response = await api.delete(`/projects/${projectId}/images/${imageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting project image:', error);
    throw error;
  }
};

// const assignProjectsToUser = async (userId, projectIds) => {
//   try {
//     const response = await api.post(`/users/${userId}/projects`, { projectIds });
//     return response.data;
//   } catch (error) {
//     console.error('Error assigning projects to user:', error);
//     throw error;
//   }
// };

const assignProjectsToUser = async (userId, projectIds) => {
  try {
    const response = await api.post(
      `/users/${userId}/projects`, 
      { projectIds },
      {
        headers: {
          'Cache-Control': 'no-cache',
          'If-None-Match': ''  // Force fresh response
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error assigning projects:', error);
    throw error;
  }
};

const fetchUserProjects = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/projects`, {
      headers: {
        'Cache-Control': 'no-cache',
        'If-None-Match': ''  // Force fresh response
      }
    });
    console.log('User projects response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return { data: [] };
  }
};

const checkUsernameAndRole = async (username) => {
  try {
    const response = await publicApi.post('/users/check-username-and-role', { username });
    return {
      isValid: response.data.isValid,
      role: response.data.role
    };
  } catch (error) {
    console.error('Error checking username and role:', error);
    throw error;
  }
};

const fetchOtherComponentsByProjectIdV2 = async (projectId) => {
  try {
    const response = await api.get(`/other-components/project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching other components:', error);
    throw error;
  }
};

const updateOtherComponentDetails = async (componentId, data) => {
  try {
    const response = await api.put(`/other-components/${componentId}/details`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating other component details:', error);
    throw error;
  }
};

const deleteOtherComponentById = async (componentId) => {
  try {
    await api.delete(`/other-components/${componentId}`);
  } catch (error) {
    console.error('Error deleting other component:', error);
    throw error;
  }
};

const deleteComponent = async (componentId) => {
  try {
    const response = await api.delete(`/components/${componentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting component:', error);
    throw error;
  }
};

const getProjectIdFromSectionId = async (sectionId) => {
  try {
    if (!sectionId) return null;
    const response = await api.get(`/sections/${sectionId}`);
    return response.data.project_id;
  } catch (error) {
    console.error('Error getting project ID from section:', error);
    return null;
  }
};

const checkUserProjectPermission = async (userId, projectId) => {
  try {
    const userProfile = await fetchUserProfile();
    console.log('User profile:', userProfile); // Debug log

    // Admin always has permission
    if (userProfile.role === 'Admin') {
      return { canEdit: true };
    }

    if (!projectId) {
      console.log('No project ID provided');
      return { canEdit: false };
    }

    // For Site User, check project assignments
    const userProjects = await fetchUserProjects(userId);
    console.log('User projects:', userProjects); // Debug log

    const hasProjectAccess = userProjects?.data?.some(project => 
      project.project_id?.toString() === projectId?.toString()
    );

    console.log('Permission check result:', {
      role: userProfile.role,
      hasProjectAccess,
      projectId
    });

    return {
      canEdit: userProfile.role === 'Site User' && hasProjectAccess
    };
  } catch (error) {
    console.error('Error checking user project permission:', error);
    return { canEdit: false };
  }
};


export {
  api,
  publicApi,
  fetchUsers,
  deleteComponent,
  deleteProjectImage,
  checkUserProjectPermission,
  fetchUserProjects,
  checkUsernameAndRole,
  checkAuthToken,
  assignProjectsToUser,
  fetchComponentByQR,
  updateUserPassword,
  fetchProjectDetailsByComponentId,
  loginUser,
  logoutUser,
  registerUser,
  fetchUserProfile,
  fetchUserById,
  updateUserProfile,
  updateUserById,
  deleteUserById,
  fetchProjects,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  fetchSectionsByProjectId,
  fetchSectionById,
  createSection,
  updateSection,
  deleteSection,
  fetchComponentsBySectionId,
  fetchComponentsByProjectId,
  updateComponent,
  addComponentHistory,
  fetchRoles,
  uploadFileToS3,
  fetchComponentById,
  createComponent,
  downloadFile,
  openFile,
  fetchSectionByName,
  checkUsername,
  updateComponentStatus,
  uploadComponentFile,
  deleteFileRevision,
  createOtherComponent,
  fetchOtherComponentsByProjectId,
  updateOtherComponent,
  deleteOtherComponent,
  createPrecastComponent,
  fetchProjectsWithOtherComponents,
  updateOtherComponentStatus,
  createComponentsBatch,
  fetchOtherComponentsByProjectIdV2,
  updateOtherComponentDetails,
  deleteOtherComponentById,
  getProjectIdFromSectionId ,
};

export default api; // Keep the default export
