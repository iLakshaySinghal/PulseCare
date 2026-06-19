import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress, 
  Grid, 
  InputAdornment, 
  IconButton, 
  Chip,
  Stack,
  Divider
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff, 
  LocalHospital, 
  Shield, 
  Speed,
  Favorite,
  VerifiedUser
} from '@mui/icons-material';
import { loginUser, clearError } from './authSlice.js';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleQuickLogin = (roleEmail, rolePassword) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    dispatch(loginUser({ email: roleEmail, password: rolePassword }));
  };

  const isExpired = searchParams.get('expired') === 'true';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '85vh',
        p: { xs: 2, md: 4 }
      }}
    >
      <Grid 
        container 
        spacing={4} 
        alignItems="center" 
        justifyContent="center" 
        sx={{ maxWidth: 1100, width: '100%' }}
      >
        {/* Left pane: Portal details, metrics, and branding */}
        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <LocalHospital sx={{ fontSize: 45, color: '#6366f1' }} />
              <Typography 
                variant="h3" 
                sx={{ 
                  fontFamily: 'Outfit', 
                  fontWeight: 900, 
                  background: 'linear-gradient(135deg, #818cf8 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.03em'
                }}
              >
                PulseCare
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary', lineHeight: 1.3 }}>
              Decoupled, Intelligent, & Secure <br />Hospital Management System
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 450 }}>
              Connecting healthcare professionals, laboratory workflows, pharmacies, and patients in a single unified interface.
            </Typography>

            <Stack gap={2} sx={{ mb: 4 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    color: '#6366f1',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Shield fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>HIPAA Compliance Audit Logging</Typography>
                  <Typography variant="caption" color="text.secondary">Every patient view, change, and prescription is immutable and logged.</Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    background: 'rgba(236, 72, 153, 0.1)', 
                    color: '#ec4899',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Speed fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Real-Time Emergency Grid</Typography>
                  <Typography variant="caption" color="text.secondary">Triages and bed assignments update in milliseconds via WebSockets.</Typography>
                </Box>
              </Box>
            </Stack>

            {/* Glowing System Metrics */}
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ borderLeft: '3px solid #6366f1', pl: 1.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>99.9%</Typography>
                  <Typography variant="caption" color="text.secondary">System Uptime</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ borderLeft: '3px solid #ec4899', pl: 1.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>100ms</Typography>
                  <Typography variant="caption" color="text.secondary">Query Latency</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ borderLeft: '3px solid #10b981', pl: 1.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>AES-256</Typography>
                  <Typography variant="caption" color="text.secondary">Data Encryption</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Right pane: Glassmorphic sign-in panel */}
        <Grid item xs={12} md={6}>
          <Card
            className="glass-panel"
            sx={{
              width: '100%',
              maxWidth: 460,
              mx: 'auto',
              p: { xs: 2, sm: 3 },
              position: 'relative',
              overflow: 'visible',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(30, 41, 59, 0.45)',
              backdropFilter: 'blur(20px)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -3,
                left: -3,
                right: -3,
                bottom: -3,
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                zIndex: -1,
                borderRadius: '20px',
                opacity: 0.2
              }
            }}
          >
            <CardContent>
              <Box textAlign="center" mb={4}>
                <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <LocalHospital sx={{ fontSize: 32, color: '#6366f1' }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                    PulseCare
                  </Typography>
                </Box>
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
                  Access the secure clinical health portal
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
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
                      py: 1.6,
                      fontSize: '1rem',
                      boxShadow: '0 4px 15px 0 rgba(99, 102, 241, 0.4)',
                      borderRadius: 2
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Authenticate Credentials'}
                  </Button>
                </Box>
              </form>

              {/* Developer / Testing Quick Login Switcher */}
              <Box mt={4}>
                <Divider sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: '0.1em', fontWeight: 600 }}>
                    DEMO ACCESS LOGINS
                  </Typography>
                </Divider>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap gap={1.5} justifyContent="center">
                  <Chip
                    avatar={<VerifiedUser style={{ color: '#6366f1' }} />}
                    label="Super Admin"
                    onClick={() => handleQuickLogin('superadmin@hms.com', 'SuperAdmin123!')}
                    variant="outlined"
                    className="quick-login-chip"
                    sx={{ 
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                      color: '#f8fafc',
                      backgroundColor: 'rgba(99, 102, 241, 0.05)'
                    }}
                  />
                  <Chip
                    avatar={<Favorite style={{ color: '#ec4899' }} />}
                    label="Patient Portal"
                    onClick={() => handleQuickLogin('patient@hms.com', 'Patient123!')}
                    variant="outlined"
                    className="quick-login-chip"
                    sx={{ 
                      borderColor: 'rgba(236, 72, 153, 0.3)',
                      color: '#f8fafc',
                      backgroundColor: 'rgba(236, 72, 153, 0.05)'
                    }}
                  />
                  <Chip
                    avatar={<LocalHospital style={{ color: '#10b981' }} />}
                    label="Physician"
                    onClick={() => handleQuickLogin('doctor@hms.com', 'Doctor123!')}
                    variant="outlined"
                    className="quick-login-chip"
                    sx={{ 
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                      color: '#f8fafc',
                      backgroundColor: 'rgba(16, 185, 129, 0.05)'
                    }}
                  />
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;

