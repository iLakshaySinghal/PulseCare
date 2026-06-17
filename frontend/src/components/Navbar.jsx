import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, IconButton, Badge, Box, Chip } from '@mui/material';
import { Notifications, ExitToApp, AccountCircle } from '@mui/icons-material';
import { logoutUser } from '../features/auth/authSlice.js';

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate('/login');
    });
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(30, 41, 59, 0.45)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.2)',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" component={Link} to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontFamily: 'Outfit',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <span>🏥</span> Pulsecare
          </Typography>
        </Box>

        {user && (
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<AccountCircle />}
              label={`${user.firstName} (${user.role})`}
              color="primary"
              variant="outlined"
              sx={{
                fontFamily: 'Outfit',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: '#818cf8',
                fontWeight: 600
              }}
            />

            <IconButton
              component={Link}
              to="/notifications"
              color="inherit"
              sx={{
                '&:hover': {
                  color: '#ec4899',
                  backgroundColor: 'rgba(236, 72, 153, 0.08)'
                }
              }}
            >
              <Badge color="secondary" variant="dot">
                <Notifications />
              </Badge>
            </IconButton>

            <Button
              color="error"
              variant="outlined"
              size="small"
              startIcon={<ExitToApp />}
              onClick={handleLogout}
              sx={{
                borderColor: 'rgba(244, 63, 94, 0.4)',
                backgroundColor: 'rgba(244, 63, 94, 0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  borderColor: '#f43f5e'
                }
              }}
            >
              Log Out
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
