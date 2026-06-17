import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, IconButton, Badge, Box, Chip } from '@mui/material';
import { Notifications, ExitToApp, AccountCircle, LightMode, DarkMode } from '@mui/icons-material';
import { logoutUser } from '../features/auth/authSlice.js';
import { toggleTheme } from '../features/theme/themeSlice.js';

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate('/login');
    });
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: mode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: mode === 'dark' ? '0 4px 20px 0 rgba(0, 0, 0, 0.2)' : '0 4px 20px 0 rgba(15, 23, 42, 0.05)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        color: 'inherit'
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

        <Box display="flex" alignItems="center" gap={1.5}>
          {/* Theme Toggle Button (Animated on hover & toggle) */}
          <IconButton
            onClick={() => dispatch(toggleTheme())}
            color="inherit"
            aria-label="Toggle Theme Mode"
            sx={{
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s',
              '&:hover': {
                transform: 'rotate(45deg) scale(1.1)',
                color: mode === 'dark' ? '#f59e0b' : '#6366f1',
                backgroundColor: mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)'
              }
            }}
          >
            {mode === 'dark' ? (
              <LightMode sx={{ fontSize: 22 }} />
            ) : (
              <DarkMode sx={{ fontSize: 22 }} />
            )}
          </IconButton>

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
                  color: mode === 'dark' ? '#818cf8' : '#4f46e5',
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
