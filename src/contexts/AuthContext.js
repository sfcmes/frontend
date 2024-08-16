import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { loginUser, logoutUser } from 'src/utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.setToken(token);
        try {
          console.log('Initializing auth, token found:', token);
          await fetchUser();
        } catch (error) {
          console.error('Error initializing auth:', error);
          setError('Failed to initialize authentication');
          // Clear invalid token
          localStorage.removeItem('token');
          api.setToken(null);
        }
      } else {
        console.log('No token found, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUser = async () => {
    try {
      console.log('Fetching user profile...');
      const response = await api.get('/users/me');
      console.log('User profile fetched:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    setError(null);
    try {
      console.log('Attempting to login with:', emailOrUsername);
      const response = await loginUser({ emailOrUsername, password });
      console.log('Login response:', response);
      if (response.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        api.setToken(response.data.token);
        await fetchUser();
        return { success: true };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login');
      return { success: false, error: error.message || 'Failed to login' };
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out');
      await logoutUser();
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      api.setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export { AuthContext };