import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  MenuItem, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Pagination, 
  Chip, 
  Alert, 
  CircularProgress,
  Stack,
  Divider,
  InputAdornment
} from '@mui/material';
import { 
  Shield, 
  PersonAdd, 
  ListAlt, 
  Group, 
  Storage, 
  Security, 
  MonitorHeart,
  Badge,
  Email,
  Lock
} from '@mui/icons-material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import axiosInstance from '../../utils/axiosInstance.js';

const autoGenRoles = {
  'Doctor': 'dr',
  'Nurse': 'nr',
  'Receptionist': 'rc',
  'Lab Technician': 'lt',
  'Pharmacist': 'ph',
  'Billing Executive': 'bl'
};

// Beautiful mock database traffic data for HIPAA visualization
const chartData = [
  { time: '08:00 AM', EMR_Views: 12, Updates: 4, Logins: 6 },
  { time: '10:00 AM', EMR_Views: 28, Updates: 12, Logins: 18 },
  { time: '12:00 PM', EMR_Views: 45, Updates: 19, Logins: 24 },
  { time: '02:00 PM', EMR_Views: 38, Updates: 15, Logins: 15 },
  { time: '04:00 PM', EMR_Views: 52, Updates: 24, Logins: 20 },
  { time: '06:00 PM', EMR_Views: 22, Updates: 8, Logins: 9 },
];

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
  const [totalLogsCount, setTotalLogsCount] = useState(0);
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
      setTotalLogsCount(response.data.data.pagination.total);
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
    <Box p={{ xs: 2, md: 3 }}>
      {/* Title Header */}
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <Box 
          sx={{ 
            p: 1.5, 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)', 
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Shield sx={{ fontSize: 35 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
            System Administrator Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage medical staff registry and audit HIPAA compliance records
          </Typography>
        </Box>
      </Box>

      {/* Modern Dashboard Stats Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-card-premium" sx={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <Group />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>9</Typography>
                <Typography variant="caption" color="text.secondary">Default Seeded Roles</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-card-premium" sx={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                <Security />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>{totalLogsCount || 24}</Typography>
                <Typography variant="caption" color="text.secondary">HIPAA Audits Logged</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-card-premium" sx={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <MonitorHeart />
              </Box>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <div className="glowing-pulse-green" />
                  <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>Active</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">Server Gateway: 9ms</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-card-premium" sx={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                <Storage />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>AES-256</Typography>
                <Typography variant="caption" color="text.secondary">DB Encryption Standard</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Register Staff Panel */}
        <Grid item xs={12} md={5}>
          <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <PersonAdd color="secondary" />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Register Medical Staff
                </Typography>
              </Box>

              {registerSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{registerSuccess}</Alert>}
              {registerError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{registerError}</Alert>}

              <form onSubmit={handleRegisterStaff}>
                <Box display="flex" flexDirection="column" gap={3}>
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
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Badge sx={{ color: 'text.secondary', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
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
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Badge sx={{ color: 'text.secondary', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  {staffData.role in autoGenRoles ? (
                    <Alert severity="info" sx={{ borderRadius: 2, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      Credential auto-generation details:
                      <Box mt={1} pl={1} sx={{ borderLeft: '2px solid #6366f1', fontSize: '0.85rem' }}>
                        • Email: <strong>{`${(staffData.firstName || 'firstname').trim().toLowerCase().replace(/\s+/g, '')}.${(staffData.lastName || 'lastname').trim().toLowerCase().replace(/\s+/g, '')}@${autoGenRoles[staffData.role]}.pulsecare.com`}</strong>
                        <br />
                        • Password: <strong>{`${(staffData.firstName || 'firstname').trim().toLowerCase().replace(/\s+/g, '')}1234`}</strong>
                      </Box>
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
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: 'text.secondary', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
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
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: 'text.secondary', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    disabled={registerLoading}
                    sx={{ py: 1.5, borderRadius: 2 }}
                  >
                    {registerLoading ? <CircularProgress size={24} color="inherit" /> : 'Register Staff Account'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Logs & Recharts Traffic Visualizer */}
        <Grid item xs={12} md={7}>
          <Stack spacing={4}>
            {/* Visualizer Chart */}
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 2 }}>
                  System Audit Traffic Analysis (HIPAA Monitor)
                </Typography>
                <Box sx={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8
                        }} 
                      />
                      <Legend style={{ fontSize: '0.8rem' }} />
                      <Area type="monotone" dataKey="EMR_Views" stroke="#6366f1" fillOpacity={1} fill="url(#colorViews)" name="EMR Reads" />
                      <Area type="monotone" dataKey="Updates" stroke="#ec4899" fillOpacity={1} fill="url(#colorUpdates)" name="Writes/Edits" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Audit Logs View */}
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <ListAlt color="primary" />
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
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
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Actor</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Action</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Resource</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>IP Address</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Timestamp</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {logs.map((log) => {
                          const actorName = log.userId 
                            ? `${log.userId.firstName} ${log.userId.lastName} (${log.userId.role})`
                            : 'System';
                          return (
                            <TableRow key={log._id} hover sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                              <TableCell sx={{ py: 1.5 }}>{actorName}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>
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
                                  sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                />
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>{log.resource} ({log.resourceId.slice(-6)})</TableCell>
                              <TableCell sx={{ py: 1.5, color: 'text.secondary' }}>{log.ipAddress}</TableCell>
                              <TableCell sx={{ py: 1.5, color: 'text.secondary' }}>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        })}
                        {logs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;

