import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress, Box, Typography } from '@mui/material';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f172a'
        }}
      >
        <CircularProgress color="primary" size={50} />
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading security session...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and save previous location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Deny access
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          p: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
          403 - Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxW: 500 }}>
          Your account role '{user.role}' does not have sufficient permissions to view this resource. 
          Please contact your Hospital System Administrator if this is in error.
        </Typography>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
