import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_BASE_URL = 'https://sfcpcbackend.ngrok.app/api'; // Use HTTPS

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Authentication error. Redirecting to login...');
    }
    return Promise.reject(error);
  }
);

api.setToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.request.use(
  (config) => {
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
      api.setToken(response.data.token);
      // Store token securely (consider using HttpOnly cookies instead)
      localStorage.setItem('token', response.data.token);
    }
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
    return { success: false, error: error.response ? error.response.data.message : 'An unexpected error occurred' };
  }
};

const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem('token'); 
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
    const response = await api.get('/projects');
    console.log('Fetched projects:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

const fetchProjectById = (projectId) => api.get(`/projects/${projectId}`);
const createProject = (data) => api.post('/projects', data);
const updateProject = (projectId, data) => api.put(`/projects/${projectId}`, data);
const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);

const fetchSectionsByProjectId = (projectId) => api.get(`/sections/projects/${projectId}/sections`);
const fetchSectionById = (sectionId) => api.get(`/sections/${sectionId}`);
const createSection = (data) => api.post('/sections', data);
const updateSection = (sectionId, data) => api.put(`/sections/${sectionId}`, data);
const deleteSection = (sectionId) => api.delete(`/sections/${sectionId}`);

const fetchComponentsBySectionId = (sectionId) => api.get(`/components/section/${sectionId}`);
const fetchComponentsByProjectId = async (projectId) => {
  try {
    const response = await api.get(`/components/project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching components for project ${projectId}:`, error);
    if (error.response && error.response.status === 404) {
      return [];
    }
    throw error;
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

const updateComponent = (componentId, data) => api.put(`/components/${componentId}`, data);
const deleteComponent = (componentId) => api.delete(`/components/${componentId}`);

const fetchComponentById = async (componentId) => {
  try {
    const response = await api.get(`/components/${componentId}`);
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
      params: { name: sectionName }
    });
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error fetching section by name:', error);
    throw error;
  }
};

export {
  api,
  loginUser,
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
  deleteComponent,
  addComponentHistory,
  fetchRoles,
  uploadFileToS3,
  fetchComponentById,
  createComponent,
  downloadFile,
  openFile,
  fetchSectionByName,
};

export default api; // Keep the default export