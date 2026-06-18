import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, TextField, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, Chip, Alert, CircularProgress } from '@mui/material';
import { Shield, PersonAdd, ListAlt } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance.js';

const autoGenRoles = {
  'Doctor': 'dr',
  'Nurse': 'nr',
  'Receptionist': 'rc',
  'Lab Technician': 'lt',
  'Pharmacist': 'ph',
  'Billing Executive': 'bl'
};

export const AdminDashboard = () => {
  // Staff registration form state
  const [staffData, setStaffData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Doctor'
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Audit logs state
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filterAction, setFilterAction] = useState('');

  const handleStaffChange = (e) => {
    setStaffData({ ...staffData, [e.target.name]: e.target.value });
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');
    setRegisterSuccess('');

    try {
      const payload = { ...staffData };
      if (payload.role in autoGenRoles) {
        delete payload.email;
        delete payload.password;
      }
      const response = await axiosInstance.post('/auth/register-staff', payload);
      setRegisterSuccess(response.data.message);
      setStaffData({ email: '', password: '', firstName: '', lastName: '', role: 'Doctor' });
      fetchAuditLogs();
    } catch (err) {
      setRegisterError(err.response?.data?.error?.message || 'Failed to register staff member');
    } finally {
      setRegisterLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const actionQuery = filterAction ? `&action=${filterAction}` : '';
      const response = await axiosInstance.get(`/audit-logs?page=${page}&limit=10${actionQuery}`);
      setLogs(response.data.data.logs);
      setTotalPages(response.data.data.pagination.pages);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, filterAction]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <Shield color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            System Administrator Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage medical staff registry and audit HIPAA compliance records
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Register Staff Panel */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <PersonAdd color="secondary" />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                  Register Medical Staff
                </Typography>
              </Box>

              {registerSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{registerSuccess}</Alert>}
              {registerError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{registerError}</Alert>}

              <form onSubmit={handleRegisterStaff}>
                <Box display="flex" flexDirection="column" gap={2.5}>
                  <TextField
                    name="role"
                    label="System Role"
                    select
                    fullWidth
                    required
                    value={staffData.role}
                    onChange={handleStaffChange}
                    disabled={registerLoading}
                  >
                    <MenuItem value="Hospital Admin">Hospital Admin</MenuItem>
                    <MenuItem value="Doctor">Doctor</MenuItem>
                    <MenuItem value="Nurse">Nurse</MenuItem>
                    <MenuItem value="Receptionist">Receptionist</MenuItem>
                    <MenuItem value="Lab Technician">Lab Technician</MenuItem>
                    <MenuItem value="Pharmacist">Pharmacist</MenuItem>
                    <MenuItem value="Billing Executive">Billing Executive</MenuItem>
                  </TextField>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        name="firstName"
                        label="First Name"
                        fullWidth
                        required
                        value={staffData.firstName}
                        onChange={handleStaffChange}
                        disabled={registerLoading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        name="lastName"
                        label="Last Name"
                        fullWidth
                        required
                        value={staffData.lastName}
                        onChange={handleStaffChange}
                        disabled={registerLoading}
                      />
                    </Grid>
                  </Grid>

                  {staffData.role in autoGenRoles ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      {staffData.role} login credentials will be automatically generated:
                      <br />
                      • Email: <strong>{`${(staffData.firstName || 'firstname').trim().toLowerCase().replace(/\s+/g, '')}.${(staffData.lastName || 'lastname').trim().toLowerCase().replace(/\s+/g, '')}@${autoGenRoles[staffData.role]}.pulsecare.com`}</strong>
                      <br />
                      • Password: <strong>{`${(staffData.firstName || 'firstname').trim().toLowerCase().replace(/\s+/g, '')}1234`}</strong>
                    </Alert>
                  ) : (
                    <>
                      <TextField
                        name="email"
                        label="Staff Email"
                        type="email"
                        fullWidth
                        required
                        value={staffData.email}
                        onChange={handleStaffChange}
                        disabled={registerLoading}
                      />

                      <TextField
                        name="password"
                        label="Temporary Password"
                        type="password"
                        fullWidth
                        required
                        value={staffData.password}
                        onChange={handleStaffChange}
                        disabled={registerLoading}
                      />
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    disabled={registerLoading}
                    sx={{ py: 1.2 }}
                  >
                    {registerLoading ? <CircularProgress size={24} color="inherit" /> : 'Register Staff Account'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Logs View */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ListAlt color="primary" />
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                    HIPAA Compliance Audit Trails
                  </Typography>
                </Box>
                <TextField
                  select
                  size="small"
                  label="Filter Action"
                  value={filterAction}
                  onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="USER_LOGIN">User Login</MenuItem>
                  <MenuItem value="STAFF_REGISTRATION">Staff Registration</MenuItem>
                  <MenuItem value="PATIENT_REGISTRATION">Patient Intake</MenuItem>
                  <MenuItem value="PATIENT_SELF_REGISTRATION">Patient Self-Intake</MenuItem>
                  <MenuItem value="PATIENT_UPDATE">Demographics Update</MenuItem>
                  <MenuItem value="EMR_CREATION">EMR Creation</MenuItem>
                  <MenuItem value="EMR_ATTACHMENT_UPLOAD">Attachment Upload</MenuItem>
                </TextField>
              </Box>

              {logsLoading ? (
                <Box display="flex" justifyContent="center" py={10}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Actor</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Resource</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>IP Address</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((log) => {
                        const actorName = log.userId 
                          ? `${log.userId.firstName} ${log.userId.lastName} (${log.userId.role})`
                          : 'System';
                        return (
                          <TableRow key={log._id}>
                            <TableCell>{actorName}</TableCell>
                            <TableCell>
                              <Chip
                                label={log.action}
                                size="small"
                                color={
                                  log.action.includes('SECURITY') 
                                    ? 'error' 
                                    : log.action.includes('REGISTRATION') || log.action.includes('CREATION')
                                      ? 'success' 
                                      : 'info'
                                }
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                              />
                            </TableCell>
                            <TableCell>{log.resource} ({log.resourceId.slice(-6)})</TableCell>
                            <TableCell>{log.ipAddress}</TableCell>
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                      {logs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No compliance logs match the criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
