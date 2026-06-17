import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import axiosInstance from '../../utils/axiosInstance.js';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axiosInstance.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

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
      <Card className="glass-panel" sx={{ width: '100%', maxWidth: 420, p: 2 }}>
        <CardContent>
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontFamily: 'Outfit',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #818cf8 0%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              New Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please enter your new portal credentials below
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Password reset successfully! Redirecting you to login...
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <Box display="flex" flexDirection="column" gap={3}>
                <TextField
                  label="New Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  InputLabelProps={{ style: { color: '#94a3b8' } }}
                />

                <TextField
                  label="Confirm Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  InputLabelProps={{ style: { color: '#94a3b8' } }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={loading || !token}
                  sx={{
                    py: 1.5,
                    boxShadow: '0 4px 15px 0 rgba(99, 102, 241, 0.4)'
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                </Button>
              </Box>
            </form>
          )}

          <Box mt={3} textAlign="center">
            <Link
              to="/login"
              style={{
                color: '#818cf8',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Back to Sign In
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPassword;
