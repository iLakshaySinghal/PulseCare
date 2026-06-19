import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Divider, Avatar
} from '@mui/material';
import {
  Warning, Add, Assignment, MedicalServices, CheckCircle, SwapHoriz
} from '@mui/icons-material';
import {
  fetchEmergencyCases, registerEmergencyCase, assignEmergencyStaff,
  updateEmergencyTreatment, receiveSocketEmergencyUpdate
} from './emergencySlice.js';
import { getSocket } from '../../utils/socket.js';
import axiosInstance from '../../utils/axiosInstance.js';

export const EmergencyDashboard = () => {
  const dispatch = useDispatch();
  const { cases, loading } = useSelector((state) => state.emergency);
  const { user } = useSelector((state) => state.auth);

  const canRegister = ['Nurse', 'Receptionist', 'Hospital Admin', 'Super Admin'].includes(user?.role);
  const canAssign = ['Nurse', 'Doctor', 'Hospital Admin', 'Super Admin'].includes(user?.role);
  const canTreat = ['Doctor', 'Nurse'].includes(user?.role);

  const [openRegister, setOpenRegister] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openTreat, setOpenTreat] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // Registration inputs
  const [complaint, setComplaint] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [anonName, setAnonName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientsList, setPatientsList] = useState([]);

  // Assignment inputs
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [assignedNurse, setAssignedNurse] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);
  const [nursesList, setNursesList] = useState([]);

  // Treatment inputs
  const [treatStatus, setTreatStatus] = useState('Under Treatment');
  const [treatmentNotes, setTreatmentNotes] = useState('');

  useEffect(() => {
    dispatch(fetchEmergencyCases());
    
    // Load patients and staff list
    axiosInstance.get('/patients').then((res) => {
      setPatientsList(res.data.data.patients || []);
    }).catch((err) => console.error(err));

    axiosInstance.get('/appointments/doctors').then((res) => {
      setDoctorsList(res.data.data || []);
    }).catch((err) => console.error(err));

    axiosInstance.get('/appointments/nurses').then((res) => {
      setNursesList(res.data.data || []);
    }).catch((err) => console.error(err));

    const socket = getSocket();
    if (socket) {
      socket.emit('join_emergency_room');
      socket.on('emergency_queue_updated', (data) => {
        dispatch(receiveSocketEmergencyUpdate(data));
      });
      return () => {
        socket.emit('leave_emergency_room');
        socket.off('emergency_queue_updated');
      };
    }
  }, [dispatch]);

  const handleRegister = () => {
    dispatch(registerEmergencyCase({
      patientId: patientId || null,
      anonymousPatientName: anonName,
      chiefComplaint: complaint,
      priority
    })).then(() => {
      setOpenRegister(false);
      setComplaint('');
      setAnonName('');
      setPatientId('');
      dispatch(fetchEmergencyCases());
    });
  };

  const handleAssignSubmit = () => {
    if (!selectedCase) return;
    dispatch(assignEmergencyStaff({
      id: selectedCase._id,
      assignedDoctorId: assignedDoctor,
      assignedNurseId: assignedNurse
    })).then(() => {
      setOpenAssign(false);
      setSelectedCase(null);
      dispatch(fetchEmergencyCases());
    });
  };

  const handleTreatmentSubmit = () => {
    if (!selectedCase) return;
    dispatch(updateEmergencyTreatment({
      id: selectedCase._id,
      status: treatStatus,
      treatmentNotes
    })).then(() => {
      setOpenTreat(false);
      setSelectedCase(null);
      dispatch(fetchEmergencyCases());
    });
  };

  return (
    <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#ffffff', fontFamily: 'Outfit' }}>
            Emergency Command Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time ER patient tracking and triage allocation system.
          </Typography>
        </Box>
        {canRegister && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenRegister(true)}
            sx={{
              background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              borderRadius: 2
            }}
          >
            ER Registration
          </Button>
        )}
      </Box>

      {/* Triage Priority Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {['Critical', 'High', 'Medium', 'Low'].map((level) => {
          const count = cases.filter(c => c.priority === level).length;
          return (
            <Grid item xs={12} sm={6} md={3} key={level}>
              <Paper
                className="glass-panel"
                sx={{
                  p: 2,
                  borderLeft: `5px solid ${
                    level === 'Critical' ? '#f87171' :
                    level === 'High' ? '#fb923c' :
                    level === 'Medium' ? '#facc15' : '#4ade80'
                  }`
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  {level} Priority Cases
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mt: 1 }}>
                  {count}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Emergency Active Queue */}
      <Paper className="glass-panel" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Outfit' }}>Triage Priority Queue</Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
              <TableRow>
                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Case Number</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Patient Name</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Chief Complaint</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Priority Score</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Assigned Team</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c._id}>
                  <TableCell sx={{ fontWeight: 600 }}>{c.caseNumber}</TableCell>
                  <TableCell>
                    {c.patientId ? `${c.patientId.firstName} ${c.patientId.lastName}` : c.anonymousPatientName || 'Anonymous Patient'}
                  </TableCell>
                  <TableCell>{c.triageDetails?.chiefComplaint}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.priority}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        backgroundColor:
                          c.priority === 'Critical' ? 'rgba(239, 68, 68, 0.15)' :
                          c.priority === 'High' ? 'rgba(249, 115, 22, 0.15)' :
                          c.priority === 'Medium' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color:
                          c.priority === 'Critical' ? '#f87171' :
                          c.priority === 'High' ? '#fb923c' :
                          c.priority === 'Medium' ? '#facc15' : '#4ade80',
                        border: '1px solid currentColor'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={c.status} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Dr. {c.assignedDoctorId ? c.assignedDoctorId.lastName : 'Unassigned'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Nurse: {c.assignedNurseId ? c.assignedNurseId.firstName : 'Unassigned'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {canAssign && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Assignment />}
                          onClick={() => { setSelectedCase(c); setOpenAssign(true); }}
                        >
                          Assign Team
                        </Button>
                      )}
                      {canTreat && (
                        <Button
                          variant="contained"
                          size="small"
                          color="secondary"
                          startIcon={<MedicalServices />}
                          onClick={() => { setSelectedCase(c); setOpenTreat(true); }}
                        >
                          Treat / Status
                        </Button>
                      )}
                      {!canAssign && !canTreat && (
                        <Typography variant="caption" color="text.secondary">
                          No actions available
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {cases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">Triage queue is clear.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ER Intake Registration Dialog */}
      <Dialog open={openRegister} onClose={() => setOpenRegister(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ER Intake & Triage Registration</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <FormControl fullWidth>
              <InputLabel>Link Patient File</InputLabel>
              <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} label="Link Patient File">
                <MenuItem value="">Unregistered / Anonymous</MenuItem>
                {patientsList.map(p => (
                  <MenuItem key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.patientId})</MenuItem>
                ))}
              </Select>
            </FormControl>

            {!patientId && (
              <TextField
                label="Anonymous Description Name"
                placeholder="e.g. Unknown Female (~30s, unconscious)"
                value={anonName}
                onChange={(e) => setAnonName(e.target.value)}
              />
            )}

            <TextField
              label="Chief Complaint"
              multiline
              rows={3}
              placeholder="e.g. Severe chest pains, difficulty breathing"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Triage Priority Level</InputLabel>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)} label="Triage Priority Level">
                <MenuItem value="Critical">Critical (Immediate Resuscitation)</MenuItem>
                <MenuItem value="High">High (Emergent)</MenuItem>
                <MenuItem value="Medium">Medium (Urgent)</MenuItem>
                <MenuItem value="Low">Low (Non-urgent)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRegister(false)}>Cancel</Button>
          <Button onClick={handleRegister} variant="contained" color="error">Admit to ER</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Team Dialog */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign ER Trauma Response Team</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <FormControl fullWidth>
              <InputLabel>Assign Trauma Surgeon/Physician</InputLabel>
              <Select value={assignedDoctor} onChange={(e) => setAssignedDoctor(e.target.value)} label="Assign Trauma Surgeon/Physician">
                {doctorsList.map(d => (
                  <MenuItem key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assign Response Nurse</InputLabel>
              <Select value={assignedNurse} onChange={(e) => setAssignedNurse(e.target.value)} label="Assign Response Nurse">
                {nursesList.map(n => (
                  <MenuItem key={n._id} value={n._id}>{n.firstName} {n.lastName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
          <Button onClick={handleAssignSubmit} variant="contained" color="primary">Deploy Team</Button>
        </DialogActions>
      </Dialog>

      {/* Treat / Status Dialog */}
      <Dialog open={openTreat} onClose={() => setOpenTreat(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Emergency Treatment Log</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <FormControl fullWidth>
              <InputLabel>Case Status</InputLabel>
              <Select value={treatStatus} onChange={(e) => setTreatStatus(e.target.value)} label="Case Status">
                <MenuItem value="Triage">Triage</MenuItem>
                <MenuItem value="Under Treatment">Under Treatment</MenuItem>
                <MenuItem value="Admitted">Admitted to Inpatient Ward</MenuItem>
                <MenuItem value="Discharged">Discharged</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Treatment Notes / Interventions"
              multiline
              rows={4}
              placeholder="Record administered medications, surgical procedures, or disposition plans..."
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTreat(false)}>Cancel</Button>
          <Button onClick={handleTreatmentSubmit} variant="contained" color="primary">Update Case</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyDashboard;
