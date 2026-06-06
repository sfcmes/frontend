import React, { createContext, useContext, useState, useEffect } from 'react';
import api from 'src/utils/api';

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
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const fetchUser = async () => {
    try {
      console.log('Fetching user');
      const response = await api.get('/users/profile');
      console.log('User fetched:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    console.log('Logging in with:', { email: username, password }); // Change username to email
    const response = await api.post('/auth/login', { email: username, password }); // Change username to email
    console.log('Login response:', response.data);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    api.setToken(token);
    setUser(user);
  };

  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export { AuthContext };
