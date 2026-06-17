import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { loginUser, clearError } from './authSlice.js';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginUser({ email, password }));
  };

  const isExpired = searchParams.get('expired') === 'true';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '85vh',
        p: 2
      }}
    >
      <Card
        className="glass-panel"
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 2,
          position: 'relative',
          overflow: 'visible',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            zIndex: -1,
            borderRadius: '18px',
            opacity: 0.15
          }
        }}
      >
        <CardContent>
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #818cf8 0%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access the secure HMS Health Portal
            </Typography>
          </Box>

          {isExpired && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              Session expired. Please log in again.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={3}>
              <TextField
                label="Email Address"
                type="email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                InputLabelProps={{ style: { color: '#94a3b8' } }}
              />

              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                InputLabelProps={{ style: { color: '#94a3b8' } }}
              />

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={-1}>
                <Link
                  to="/forgot-password"
                  style={{
                    color: '#818cf8',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}
                >
                  Forgot Password?
                </Link>
                <Link
                  to="/register"
                  style={{
                    color: '#f472b6',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}
                >
                  Create Patient File
                </Link>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  boxShadow: '0 4px 15px 0 rgba(99, 102, 241, 0.4)'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Authenticate'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
