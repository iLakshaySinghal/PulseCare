import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { PlayCircleOutline, HourglassEmpty, CheckCircleOutline } from '@mui/icons-material';
import { fetchAppointments } from '../appointments/appointmentSlice.js';
import { startConsultation } from './consultationSlice.js';

export const DoctorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { appointments, loading } = useSelector((state) => state.appointments);

  useEffect(() => {
    // Fetch appointments for this doctor that are Confirmed or In Consultation
    dispatch(fetchAppointments({ doctorId: user.id }));
  }, [dispatch, user.id]);

  const handleStartConsultation = (appointmentId) => {
    dispatch(startConsultation(appointmentId)).then((res) => {
      if (!res.error) {
        navigate(`/consultation/${res.payload._id}`);
      }
    });
  };

  // Filter list to active/confirmed consultations
  const activeQueues = appointments.filter(
    (a) => a.status === 'Confirmed' || a.status === 'In Consultation'
  );

  const completedConsults = appointments.filter((a) => a.status === 'Completed');

  return (
    <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Typography variant="h4" sx={{ mb: 1, color: '#ffffff', fontFamily: 'Outfit' }}>
        Physician Command Center
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage active patient queues, write clinical charts, and view reports.
      </Typography>

      <Grid container spacing={3}>
        {/* Active Consultation Queue */}
        <Grid item xs={12} md={8}>
          <Paper className="glass-panel" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <HourglassEmpty sx={{ color: '#818cf8', mr: 1 }} />
              <Typography variant="h6" sx={{ fontFamily: 'Outfit' }}>Active Consultation Queue</Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Patient Name</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Timeslot</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Reason</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeQueues.map((appt) => (
                    <TableRow key={appt._id}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {appt.patientId ? `${appt.patientId.firstName} ${appt.patientId.lastName}` : 'Unregistered'}
                      </TableCell>
                      <TableCell>{appt.slot.startTime} - {appt.slot.endTime}</TableCell>
                      <TableCell>{appt.reason || 'General Checkup'}</TableCell>
                      <TableCell>
                        <Chip
                          label={appt.status}
                          size="small"
                          sx={{
                            backgroundColor: appt.status === 'In Consultation' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: appt.status === 'In Consultation' ? '#818cf8' : '#facc15',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PlayCircleOutline />}
                          onClick={() => handleStartConsultation(appt._id)}
                          sx={{
                            background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
                            boxShadow: '0 4px 10px rgba(99,102,241,0.2)',
                            borderRadius: 1.5
                          }}
                        >
                          {appt.status === 'In Consultation' ? 'Resume Work' : 'Start Consultation'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeQueues.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">No patients in queue currently.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Quick Stats & Completed Logs */}
        <Grid item xs={12} md={4}>
          <Paper className="glass-panel" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Outfit' }}>Queue Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>{activeQueues.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Awaiting Visit</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                  <Typography variant="h4" color="success" sx={{ fontWeight: 700 }}>{completedConsults.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Completed Today</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          <Paper className="glass-panel" sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleOutline sx={{ color: '#22c55e', mr: 1 }} />
              <Typography variant="h6" sx={{ fontFamily: 'Outfit' }}>Completed Encounters</Typography>
            </Box>
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {completedConsults.map((appt) => (
                <Box key={appt._id} sx={{ mb: 1.5, p: 1.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {appt.patientId ? `${appt.patientId.firstName} ${appt.patientId.lastName}` : 'Unregistered'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Completed at {appt.slot.endTime} on {new Date(appt.appointmentDate).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
              {completedConsults.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center">No encounters completed today.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DoctorDashboard;
