// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/auth/404" />;
  }

  return children;
};

export default ProtectedRoute;
