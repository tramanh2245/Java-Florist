import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ Component, requiredRole = null }) {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <Component />;
}
export default ProtectedRoute;
