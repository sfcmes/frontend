// AuthContext.js
import React, { createContext, useContext, useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = async (credentials) => {
    try {
      console.log('Logging in with:', credentials);
      const response = await axios.post('/api/auth/login', credentials);
      console.log('Login response:', response.data);
      const { token } = response.data;
      localStorage.setItem('token', token);
      const userResponse = await axios.get('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(userResponse.data);
      console.log('User:', userResponse.data);

      // Redirect based on role
      if (userResponse.data.role === 'Admin') {
        navigate('/dashboards/modern');
      } else if (userResponse.data.role === 'Manager' || userResponse.data.role === 'Site User') {
        navigate('/dashboards/modern');
      } else {
        navigate('/forms/form-qr-code-reader');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
