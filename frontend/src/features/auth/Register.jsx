import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  MenuItem,
  InputAdornment,
  Divider,
  Stack
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Person, 
  CalendarToday, 
  Wc, 
  Phone, 
  Bloodtype, 
  Healing, 
  ContactPhone, 
  VpnKey,
  LocalHospital
} from '@mui/icons-material';
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
        p: { xs: 2, md: 4 },
        mt: 2
      }}
    >
      <Card 
        className="glass-panel" 
        sx={{ 
          width: '100%', 
          maxWidth: 800, 
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
            <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} mb={1}>
              <LocalHospital sx={{ fontSize: 32, color: '#6366f1' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'text.primary' }}>
                PulseCare
              </Typography>
            </Box>
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
              Patient File Registration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure your clinical demographic profile to initialize your secure Electronic Medical Record (EMR)
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
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <VpnKey sx={{ color: '#6366f1', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary' }}>
                      Security Credentials
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                </Grid>
                
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="password"
                    label="Secure Password"
                    type="password"
                    fullWidth
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    helperText="Minimum 8 characters"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Personal Information Section */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Person sx={{ color: '#ec4899', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary' }}>
                      Personal & Demographic Details
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="firstName"
                    label="First Name"
                    fullWidth
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Wc sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
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
                    helperText="Format: +15551234567"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Bloodtype sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Healing sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Emergency Contact */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <ContactPhone sx={{ color: '#10b981', fontSize: 20 }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, color: 'text.primary' }}>
                      Emergency Contact Details
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="emergencyName"
                    label="Contact Name"
                    fullWidth
                    required
                    value={formData.emergencyName}
                    onChange={handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
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
                    helperText="Format: +15557654321"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
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
                      py: 1.6,
                      fontSize: '1rem',
                      boxShadow: '0 4px 15px 0 rgba(99, 102, 241, 0.4)',
                      borderRadius: 2
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

