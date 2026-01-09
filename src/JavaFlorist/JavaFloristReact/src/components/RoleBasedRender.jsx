import React from 'react';
import { useAuth } from '../context/AuthContext';

export function RoleBasedRender({ roles, children, fallback = null }) {
  const { hasRole } = useAuth();
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  const hasPermission = requiredRoles.some(role => hasRole(role));

  return hasPermission ? children : fallback;
}

export default RoleBasedRender;
