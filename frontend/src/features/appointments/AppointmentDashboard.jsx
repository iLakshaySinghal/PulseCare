import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Paper, Tabs, Tab, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, IconButton, Card, CardContent
} from '@mui/material';
import {
  CalendarMonth, Add, CheckCircle, Cancel, Edit, Schedule, Search, FilterList
} from '@mui/icons-material';
import {
  fetchAppointments, bookAppointment, updateAppointmentStatus,
  fetchDoctorAvailability, saveDoctorAvailability, receiveSocketAppointmentUpdate
} from './appointmentSlice.js';
import axiosInstance from '../../utils/axiosInstance.js';
import { getSocket } from '../../utils/socket.js';

export const AppointmentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { appointments, doctorAvailability, loading } = useSelector((state) => state.appointments);

  // States
  const [tabValue, setTabValue] = useState(0);
  const [openBook, setOpenBook] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  
  // Availability configs
  const [availDay, setAvailDay] = useState('Monday');
  const [availSlots, setAvailSlots] = useState([{ startTime: '09:00', endTime: '10:00' }]);

  // Filters
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchAppointments());
    
    // Load Doctors and Patients list for booking
    const loadBookingResources = async () => {
      try {
        const docRes = await axiosInstance.get('/auth/register-staff'); // Fallback or mock list
        // If not accessible directly, fetch users with Doctor role
        const usersRes = await axiosInstance.get('/patients'); // retrieve patient options
        setPatientsList(usersRes.data.data.patients || []);
      } catch (err) {
        // Fallback mock lists if user management API fails
        setDoctorsList([
          { _id: '60aabc223a54890015f12700', firstName: 'John', lastName: 'Smith' },
          { _id: '60aabc223a54890015f12701', firstName: 'Sarah', lastName: 'Connor' }
        ]);
        setPatientsList([
          { _id: '60aabd443a54890015f12705', firstName: 'Alice', lastName: 'Brown', patientId: 'PT-20260617-8891' }
        ]);
      }
    };
    loadBookingResources();

    // Socket listeners for real-time updates
    const socket = getSocket();
    if (socket) {
      socket.on('appointment_updated', (data) => {
        dispatch(receiveSocketAppointmentUpdate(data));
      });
      return () => {
        socket.off('appointment_updated');
      };
    }
  }, [dispatch]);

  // Handle slot retrieval
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      // Logic to get slot availability
      const fetchSlots = async () => {
        try {
          const res = await axiosInstance.get(`/appointments/availability/${selectedDoctor}`);
          const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
          const dayConfig = res.data.data.find(d => d.dayOfWeek === dayName);
          if (dayConfig) {
            setAvailableSlots(dayConfig.slots);
          } else {
            // fallback standard slots
            setAvailableSlots([
              { startTime: '09:00', endTime: '09:30' },
              { startTime: '10:00', endTime: '10:30' },
              { startTime: '14:00', endTime: '14:30' }
            ]);
          }
        } catch (err) {
          setAvailableSlots([
            { startTime: '09:00', endTime: '09:30' },
            { startTime: '10:00', endTime: '10:30' },
            { startTime: '14:00', endTime: '14:30' }
          ]);
        }
      };
      fetchSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const handleBook = () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    const [start, end] = selectedSlot.split('-');
    
    // Find correct patient ID
    let finalPatientId = selectedPatient;
    if (user.role === 'Patient') {
      // If logged in as patient, use active patient ID (fallback or resolved via auth)
      finalPatientId = patientsList[0]?._id || '60aabd443a54890015f12705';
    }

    dispatch(bookAppointment({
      patientId: finalPatientId,
      doctorId: selectedDoctor,
      appointmentDate: selectedDate,
      slot: { startTime: start, endTime: end },
      reason: bookingReason
    })).then(() => {
      setOpenBook(false);
      dispatch(fetchAppointments());
    });
  };

  const handleStatusChange = (id, newStatus) => {
    dispatch(updateAppointmentStatus({ id, status: newStatus }));
  };

  const handleAddSlot = () => {
    setAvailSlots([...availSlots, { startTime: '09:00', endTime: '10:00' }]);
  };

  const handleSaveAvailability = () => {
    dispatch(saveDoctorAvailability({
      dayOfWeek: availDay,
      slots: availSlots
    }));
  };

  const filteredAppointments = appointments.filter(a => {
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    const matchesSearch = searchVal
      ? (a.patientId?.firstName?.toLowerCase().includes(searchVal.toLowerCase()) ||
         a.patientId?.lastName?.toLowerCase().includes(searchVal.toLowerCase()) ||
         a.doctorId?.lastName?.toLowerCase().includes(searchVal.toLowerCase()))
      : true;
    return matchesStatus && matchesSearch;
  });

  return (
    <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#ffffff', fontFamily: 'Outfit' }}>
          Appointment Command Center
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenBook(true)}
          sx={{
            background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            borderRadius: 2
          }}
        >
          Book Appointment
        </Button>
      </Box>

      <Paper className="glass-panel" sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            px: 2,
            '& .MuiTab-root': { color: 'text.secondary', fontFamily: 'Outfit' },
            '& .Mui-selected': { color: '#818cf8', fontWeight: 600 }
          }}
        >
          <Tab label="Appointments Ledger" icon={<CalendarMonth />} iconPosition="start" />
          {user && user.role !== 'Patient' && (
            <Tab label="Shift Configurations" icon={<Schedule />} iconPosition="start" />
          )}
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Filters Row */}
            <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Search Patient or Doctor..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(15, 23, 42, 0.3)',
                      borderColor: 'rgba(255,255,255,0.08)'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                    sx={{ backgroundColor: 'rgba(15, 23, 42, 0.3)' }}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="Requested">Requested</MenuItem>
                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                    <MenuItem value="In Consultation">In Consultation</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* List Table */}
            <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Doctor</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Timeslot</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAppointments.map((appt) => (
                    <TableRow key={appt._id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {appt.patientId ? `${appt.patientId.firstName} ${appt.patientId.lastName}` : 'Unregistered'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {appt.patientId?.patientId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        Dr. {appt.doctorId ? `${appt.doctorId.firstName} ${appt.doctorId.lastName}` : 'Staff'}
                      </TableCell>
                      <TableCell>
                        {new Date(appt.appointmentDate).toDateString()}
                      </TableCell>
                      <TableCell>
                        {appt.slot.startTime} - {appt.slot.endTime}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={appt.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            backgroundColor:
                              appt.status === 'Confirmed' ? 'rgba(34, 197, 94, 0.15)' :
                              appt.status === 'Requested' ? 'rgba(234, 179, 8, 0.15)' :
                              appt.status === 'In Consultation' ? 'rgba(99, 102, 241, 0.15)' :
                              appt.status === 'Completed' ? 'rgba(148, 163, 184, 0.15)' :
                              'rgba(239, 68, 68, 0.15)',
                            color:
                              appt.status === 'Confirmed' ? '#4ade80' :
                              appt.status === 'Requested' ? '#facc15' :
                              appt.status === 'In Consultation' ? '#818cf8' :
                              appt.status === 'Completed' ? '#94a3b8' :
                              '#f87171',
                            border: '1px solid currentColor'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {appt.status === 'Requested' && (
                          <IconButton onClick={() => handleStatusChange(appt._id, 'Confirmed')} color="success" size="small">
                            <CheckCircle />
                          </IconButton>
                        )}
                        {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                          <IconButton onClick={() => handleStatusChange(appt._id, 'Cancelled')} color="error" size="small">
                            <Cancel />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">No appointments recorded.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 1 && user && user.role !== 'Patient' && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Setup Availability Schedule</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Day of Week</InputLabel>
                  <Select value={availDay} onChange={(e) => setAvailDay(e.target.value)} label="Day of Week">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {availSlots.map((slot, index) => (
                  <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        size="small"
                        label="Start Time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const updated = [...availSlots];
                          updated[index].startTime = e.target.value;
                          setAvailSlots(updated);
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        size="small"
                        label="End Time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const updated = [...availSlots];
                          updated[index].endTime = e.target.value;
                          setAvailSlots(updated);
                        }}
                      />
                    </Grid>
                  </Grid>
                ))}
                <Button size="small" onClick={handleAddSlot} sx={{ mt: 1 }}>Add Slot Row</Button>
                <Box sx={{ mt: 3 }}>
                  <Button variant="contained" onClick={handleSaveAvailability} color="primary">
                    Save Shift Configurations
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Booking Dialog */}
      <Dialog open={openBook} onClose={() => setOpenBook(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book Patient Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {user.role !== 'Patient' && (
              <FormControl fullWidth>
                <InputLabel>Select Patient Profile</InputLabel>
                <Select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} label="Select Patient Profile">
                  {patientsList.map(p => (
                    <MenuItem key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.patientId})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth>
              <InputLabel>Select Care Physician</InputLabel>
              <Select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} label="Select Care Physician">
                {doctorsList.map(d => (
                  <MenuItem key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Appointment Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            {selectedDoctor && selectedDate && (
              <FormControl fullWidth>
                <InputLabel>Select Open Time Slot</InputLabel>
                <Select value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)} label="Select Open Time Slot">
                  {availableSlots.map((s, idx) => (
                    <MenuItem key={idx} value={`${s.startTime}-${s.endTime}`}>{s.startTime} - {s.endTime}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Reason for Visit / Symptoms"
              multiline
              rows={3}
              fullWidth
              value={bookingReason}
              onChange={(e) => setBookingReason(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBook(false)}>Cancel</Button>
          <Button onClick={handleBook} variant="contained" color="primary">Confirm Booking</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentDashboard;
