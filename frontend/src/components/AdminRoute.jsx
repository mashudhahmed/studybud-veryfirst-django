import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Only superusers may enter the dashboard - mirrors backend IsSuperUser.
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#7a7c90' }}>
        Loading...
      </div>
    );
  }

  if (!user || !user.is_superuser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
