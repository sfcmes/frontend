// F:\project\sfc-mes\frontend\src\services\projectService.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/';

const getAuthToken = () => {
  // Assuming the token is stored in localStorage
  return localStorage.getItem('token');
};

const createAuthHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const fetchProjects = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/projects`, createAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const fetchSectionsByProjectId = async (projectId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/sections`, createAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching sections for project ID ${projectId}:`, error);
    throw error;
  }
};

export const createProject = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/projects`, data, createAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};
