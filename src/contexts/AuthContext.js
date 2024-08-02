import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { loginUser } from 'src/utils/api';

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
          await fetchUser();
        } catch (error) {
          console.error('Error initializing auth:', error);
          setError('Failed to initialize authentication');
        }
      } else {
        setLoading(false); // Ensure loading is set to false if no token is found
      }
    };

    initializeAuth();
  }, []);

  const fetchUser = async () => {
    try {
      console.log('Fetching user');
      const response = await api.get('/users/me');
      console.log('User fetched:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      localStorage.setItem('token', response.data.token);
      api.setToken(response.data.token);
      await fetchUser();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Failed to login');
      return false;
    }
  };

  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export { AuthContext };
