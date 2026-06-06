import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.setToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Authentication API
const loginUser = (data) => api.post('/auth/login', data);
const registerUser = (data) => api.post('/auth/register', data);

// User API
const fetchUserProfile = (userId) => api.get(`/users/${userId}`);
const fetchUserById = (userId) => api.get(`/users/${userId}`);
const updateUserProfile = (data) => api.put('/users/me', data);
const updateUserById = (userId, data) => api.put(`/users/${userId}`, data);
const deleteUserById = (userId) => api.delete(`/users/${userId}`);

// Projects API
const fetchProjects = () => api.get('/projects');
const fetchProjectById = (projectId) => api.get(`/projects/${projectId}`);
const createProject = (data) => api.post('/projects', data);
const updateProject = (projectId, data) => api.put(`/projects/${projectId}`, data);
const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);

// Sections API
const fetchSectionsByProjectId = (projectId) => api.get(`/sections/projects/${projectId}/sections`);  // Corrected URL
const createSection = (data) => api.post('/sections', data);
const updateSection = (sectionId, data) => api.put(`/sections/${sectionId}`, data);
const deleteSection = (sectionId) => api.delete(`/sections/${sectionId}`);

// Components API
const fetchComponentsBySectionId = (sectionId) => api.get(`/components/section/${sectionId}`);
const fetchComponentsByProjectId = (projectId) => api.get(`/components/project/${projectId}`);
const createComponent = (data) => api.post('/components', data);
const updateComponent = (componentId, data) => api.put(`/components/${componentId}`, data);
const deleteComponent = (componentId) => api.delete(`/components/${componentId}`);

export {
  api as default,
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
  createSection,
  updateSection,
  deleteSection,
  fetchComponentsBySectionId,
  fetchComponentsByProjectId,
  createComponent,
  updateComponent,
  deleteComponent,
};
