import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Box, Typography, Card, CardContent, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, IconButton, Dialog, DialogTitle, DialogContent, Grid, MenuItem, Alert, CircularProgress, Tooltip } from '@mui/material';
import { People, Search, PersonAdd, Edit, Visibility, Assignment } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance.js';

export const PatientManagement = () => {
  const { user } = useSelector((state) => state.auth);

  // Table lists state
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Form dialogs
  const [openIntake, setOpenIntake] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Intake Form fields state
  const [formData, setFormData] = useState({
    email: '',
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
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/patients?page=${page}&limit=10&search=${search}`);
      setPatients(response.data.data.patients);
      setTotalPages(response.data.data.pagination.pages);
    } catch (err) {
      console.error('Failed to load patient register:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, search]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenUpdate = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      emergencyName: patient.emergencyContact?.name || '',
      emergencyRelation: patient.emergencyContact?.relation || '',
      emergencyPhone: patient.emergencyContact?.phone || '',
      bloodGroup: patient.bloodGroup || '',
      allergies: patient.allergies ? patient.allergies.join(', ') : ''
    });
    setOpenUpdate(true);
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      contactNumber: formData.contactNumber,
      email: formData.email || undefined,
      emergencyContact: {
        name: formData.emergencyName,
        relation: formData.emergencyRelation,
        phone: formData.emergencyPhone
      },
      bloodGroup: formData.bloodGroup || undefined,
      allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : []
    };

    try {
      await axiosInstance.post('/patients', payload);
      setSuccessMsg('Patient registered successfully!');
      setFormData({ email: '', firstName: '', lastName: '', dateOfBirth: '', gender: '', contactNumber: '', emergencyName: '', emergencyRelation: '', emergencyPhone: '', bloodGroup: '', allergies: '' });
      setTimeout(() => {
        setOpenIntake(false);
        setSuccessMsg('');
        fetchPatients();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Intake failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
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
      await axiosInstance.put(`/patients/${selectedPatient._id}`, payload);
      setSuccessMsg('Patient records updated successfully.');
      setTimeout(() => {
        setOpenUpdate(false);
        setSuccessMsg('');
        fetchPatients();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Update failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const isStaffWriter = ['Hospital Admin', 'Receptionist'].includes(user?.role);

  return (
    <Box p={3}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <People color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
              Patient Registry
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search demographics, write intakes, or view clinical history sheets
            </Typography>
          </Box>
        </Box>

        {isStaffWriter && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAdd />}
            onClick={() => {
              setFormData({ email: '', firstName: '', lastName: '', dateOfBirth: '', gender: '', contactNumber: '', emergencyName: '', emergencyRelation: '', emergencyPhone: '', bloodGroup: '', allergies: '' });
              setOpenIntake(true);
            }}
            sx={{ px: 3, py: 1 }}
          >
            New Intake Sheet
          </Button>
        )}
      </Box>

      {/* Registry Table Card */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3} maxWidth={500}>
            <Search color="primary" />
            <TextField
              placeholder="Search by ID, Name or Contact..."
              fullWidth
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Patient ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date of Birth</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Gender</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Blood Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', align: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell sx={{ fontWeight: 600, color: '#818cf8' }}>{p.patientId}</TableCell>
                      <TableCell>{p.lastName}, {p.firstName}</TableCell>
                      <TableCell>{new Date(p.dateOfBirth).toLocaleDateString()}</TableCell>
                      <TableCell>{p.gender}</TableCell>
                      <TableCell>{p.contactNumber}</TableCell>
                      <TableCell>{p.bloodGroup || '—'}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Tooltip title="View Clinical Notes">
                            <IconButton
                              component={Link}
                              to={`/emr?patientId=${p._id}`}
                              color="primary"
                              size="small"
                            >
                              <Assignment />
                            </IconButton>
                          </Tooltip>

                          {isStaffWriter && (
                            <Tooltip title="Edit Demographics">
                              <IconButton
                                color="secondary"
                                size="small"
                                onClick={() => handleOpenUpdate(p)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {patients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No records found in the Patient registry.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Intake Sheet Dialog */}
      <Dialog open={openIntake} onClose={() => setOpenIntake(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>New Patient Intake Sheet</DialogTitle>
        <DialogContent dividers>
          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
          {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
          
          <form onSubmit={handleIntakeSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="subtitle1" color="primary">Portal Association</Typography></Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Patient Portal Email (Optional)"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange}
                  helperText="Provides patient with portal credentials (auto-sends email)"
                />
              </Grid>

              <Grid item xs={12}><Typography variant="subtitle1" color="primary">Demographics</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="firstName" label="First Name" fullWidth required value={formData.firstName} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="lastName" label="Last Name" fullWidth required value={formData.lastName} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="dateOfBirth" label="Date of Birth" type="date" fullWidth required InputLabelProps={{ shrink: true }} value={formData.dateOfBirth} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="gender"
                  label="Gender"
                  select
                  fullWidth
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="contactNumber" label="Contact Number" fullWidth required value={formData.contactNumber} onChange={handleInputChange} helperText="E.g. +15551234567" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="bloodGroup"
                  label="Blood Group"
                  select
                  fullWidth
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
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
                <TextField name="allergies" label="Known Allergies (comma-separated)" fullWidth value={formData.allergies} onChange={handleInputChange} />
              </Grid>

              <Grid item xs={12}><Typography variant="subtitle1" color="primary">Emergency Contact</Typography></Grid>
              <Grid item xs={12} sm={4}>
                <TextField name="emergencyName" label="Name" fullWidth required value={formData.emergencyName} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField name="emergencyRelation" label="Relation" fullWidth required value={formData.emergencyRelation} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField name="emergencyPhone" label="Phone" fullWidth required value={formData.emergencyPhone} onChange={handleInputChange} />
              </Grid>

              <Grid item xs={12} display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button onClick={() => setOpenIntake(false)}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={submitLoading}>
                  {submitLoading ? <CircularProgress size={24} /> : 'Save Intake'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Demographics Dialog */}
      <Dialog open={openUpdate} onClose={() => setOpenUpdate(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Update Demographic File - {selectedPatient?.patientId}</DialogTitle>
        <DialogContent dividers>
          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
          {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

          <form onSubmit={handleUpdateSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField name="firstName" label="First Name" fullWidth required value={formData.firstName} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="lastName" label="Last Name" fullWidth required value={formData.lastName} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="dateOfBirth" label="Date of Birth" type="date" fullWidth required InputLabelProps={{ shrink: true }} value={formData.dateOfBirth} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="gender"
                  label="Gender"
                  select
                  fullWidth
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="contactNumber" label="Contact Number" fullWidth required value={formData.contactNumber} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="bloodGroup"
                  label="Blood Group"
                  select
                  fullWidth
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
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
                <TextField name="allergies" label="Known Allergies (comma-separated)" fullWidth value={formData.allergies} onChange={handleInputChange} />
              </Grid>

              <Grid item xs={12}><Typography variant="subtitle1" color="primary">Emergency Contact</Typography></Grid>
              <Grid item xs={12} sm={4}>
                <TextField name="emergencyName" label="Name" fullWidth required value={formData.emergencyName} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField name="emergencyRelation" label="Relation" fullWidth required value={formData.emergencyRelation} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField name="emergencyPhone" label="Phone" fullWidth required value={formData.emergencyPhone} onChange={handleInputChange} />
              </Grid>

              <Grid item xs={12} display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button onClick={() => setOpenUpdate(false)}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={submitLoading}>
                  {submitLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PatientManagement;
