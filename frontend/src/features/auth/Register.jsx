import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress, Grid, MenuItem } from '@mui/material';
import axiosInstance from '../../utils/axiosInstance.js';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    bloodGroup: '',
    allergies: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Format payload
    const payload = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      contactNumber: formData.contactNumber,
      emergencyContact: {
        name: formData.emergencyName,
        relation: formData.emergencyRelation,
        phone: formData.emergencyPhone
      },
      bloodGroup: formData.bloodGroup || undefined,
      allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    try {
      await axiosInstance.post('/auth/register-patient', payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
      // If validation error, extract details
      if (err.response?.data?.error?.details) {
        const details = err.response.data.error.details.map(d => d.message).join(', ');
        setError(`${err.response.data.error.message}: ${details}`);
      }
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
        minHeight: '90vh',
        p: 2,
        mt: 4
      }}
    >
      <Card className="glass-panel" sx={{ width: '100%', maxWidth: 750, p: 2 }}>
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
              Patient Portal Registration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill in your details below to request a Patient ID and initialize your electronic chart
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Account registered successfully! Redirecting you to sign in...
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Credentials Section */}
                <Grid item xs={12}><Typography variant="h6" color="primary">Credentials</Typography></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="email"
                    label="Email Address"
                    type="email"
                    fullWidth
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="password"
                    label="Password"
                    type="password"
                    fullWidth
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    helperText="Minimum 8 characters"
                  />
                </Grid>

                {/* Personal Information Section */}
                <Grid item xs={12}><Typography variant="h6" color="primary">Personal Details</Typography></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="firstName"
                    label="First Name"
                    fullWidth
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="lastName"
                    label="Last Name"
                    fullWidth
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="dateOfBirth"
                    label="Date of Birth"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="gender"
                    label="Gender"
                    select
                    fullWidth
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                    <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="contactNumber"
                    label="Contact Phone"
                    fullWidth
                    required
                    value={formData.contactNumber}
                    onChange={handleChange}
                    disabled={loading}
                    helperText="E.g. +15551234567"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="bloodGroup"
                    label="Blood Group"
                    select
                    fullWidth
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="allergies"
                    label="Known Allergies"
                    fullWidth
                    placeholder="E.g. Penicillin, Peanuts, Pollen (comma-separated)"
                    value={formData.allergies}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>

                {/* Emergency Contact */}
                <Grid item xs={12}><Typography variant="h6" color="primary">Emergency Contact</Typography></Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="emergencyName"
                    label="Contact Name"
                    fullWidth
                    required
                    value={formData.emergencyName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="emergencyRelation"
                    label="Relationship"
                    fullWidth
                    required
                    value={formData.emergencyRelation}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="emergencyPhone"
                    label="Contact Phone"
                    fullWidth
                    required
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    disabled={loading}
                    helperText="E.g. +15557654321"
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      boxShadow: '0 4px 15px 0 rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Register Demographic File'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}

          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#818cf8',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
