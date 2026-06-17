import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, TextField, MenuItem, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { LocalHospital, MedicalServices, PlaylistAdd, Edit } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance.js';
import { fetchAdmissions, addVitals, addTreatment, dischargePatient } from './inpatientSlice.js';

export const AdmissionDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { admissions, pagination, loading } = useSelector(state => state.inpatient);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [openVitals, setOpenVitals] = useState(false);
  const [openTreatment, setOpenTreatment] = useState(false);
  const [openDischarge, setOpenDischarge] = useState(false);

  // Form inputs
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState(72);
  const [temp, setTemp] = useState(98.6);
  const [note, setNote] = useState('');

  // Discharge inputs
  const [dischargeCond, setDischargeCond] = useState('Stable');
  const [dischargeSum, setDischargeSum] = useState('');
  const [followUp, setFollowUp] = useState('');

  // Intake Form State
  const [openIntake, setOpenIntake] = useState(false);
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [intakeData, setIntakeData] = useState({
    patientId: '',
    roomId: '',
    bedId: '',
    reason: '',
    diagnosis: ''
  });

  const isNurseDoctor = ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse'].includes(user?.role);
  const isPatient = user?.role === 'Patient';

  useEffect(() => {
    dispatch(fetchAdmissions({ page, limit: 10, status, search }));
  }, [dispatch, page, status]);

  useEffect(() => {
    if (openIntake) {
      // Fetch data needed for intake dropdowns
      const loadIntakeContext = async () => {
        try {
          const patRes = await axiosInstance.get('/patients?limit=50');
          setPatients(patRes.data.data.patients || []);
          const roomRes = await axiosInstance.get('/admissions/rooms');
          setRooms(roomRes.data.data || []);
        } catch (e) {
          console.error(e);
        }
      };
      loadIntakeContext();
    }
  }, [openIntake]);

  const handleRoomSelect = async (e) => {
    const rId = e.target.value;
    setIntakeData(prev => ({ ...prev, roomId: rId, bedId: '' }));
    try {
      const bedsRes = await axiosInstance.get('/admissions/beds');
      // Filter vacant beds for selected room
      const roomBeds = (bedsRes.data.data || []).filter(b => b.roomId?._id === rId && !b.isOccupied);
      setBeds(roomBeds);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/admissions', intakeData);
      if (response.data.success) {
        setOpenIntake(false);
        setIntakeData({ patientId: '', roomId: '', bedId: '', reason: '', diagnosis: '' });
        dispatch(fetchAdmissions({ page: 1, limit: 10, status, search }));
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Intake failed');
    }
  };

  const handlePostVitals = (e) => {
    e.preventDefault();
    dispatch(addVitals({
      id: selectedAdmission._id,
      bloodPressure: bp,
      heartRate: hr,
      temperature: temp
    }));
    setOpenVitals(false);
  };

  const handlePostTreatment = (e) => {
    e.preventDefault();
    dispatch(addTreatment({
      id: selectedAdmission._id,
      treatmentNote: note
    }));
    setNote('');
    setOpenTreatment(false);
  };

  const handlePostDischarge = (e) => {
    e.preventDefault();
    dispatch(dischargePatient({
      id: selectedAdmission._id,
      conditionAtDischarge: dischargeCond,
      treatmentSummary: dischargeSum,
      followUpInstructions: followUp
    }));
    setOpenDischarge(false);
    dispatch(fetchAdmissions({ page, limit: 10, status, search }));
  };

  return (
    <Box p={3}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <LocalHospital color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
              Inpatient Admissions Desk
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure room boards, oversee admissions tracking, and manage nurse daily rounds
            </Typography>
          </Box>
        </Box>

        {isNurseDoctor && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlaylistAdd />}
            onClick={() => setOpenIntake(true)}
          >
            New Inpatient Intake
          </Button>
        )}
      </Box>

      {/* Admissions Table List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Admission ID</TableCell>
                    {!isPatient && <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>}
                    <TableCell sx={{ fontWeight: 'bold' }}>Room & Bed</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Admitted Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    {isNurseDoctor && <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admissions.map((adm) => (
                    <TableRow key={adm._id}>
                      <TableCell sx={{ fontWeight: 600 }}>{adm.admissionId}</TableCell>
                      {!isPatient && (
                        <TableCell>
                          {adm.patientId?.firstName} {adm.patientId?.lastName}
                          <Typography variant="caption" display="block" color="text.secondary">
                            PID: {adm.patientId?.patientId}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip label={adm.roomId?.roomNumber || 'Ward'} size="small" color="primary" />
                        <Typography variant="caption" display="inline" sx={{ ml: 1 }}>
                          Bed: {adm.bedId?.bedNumber || 'N/A'} ({adm.roomId?.roomType})
                        </Typography>
                      </TableCell>
                      <TableCell>{adm.reason}</TableCell>
                      <TableCell>{new Date(adm.admissionDate).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={adm.status} size="small" color={adm.status === 'Admitted' ? 'error' : 'success'} />
                      </TableCell>
                      {isNurseDoctor && (
                        <TableCell>
                          {adm.status === 'Admitted' ? (
                            <Box display="flex" gap={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => { setSelectedAdmission(adm); setOpenVitals(true); }}
                              >
                                Vitals
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => { setSelectedAdmission(adm); setOpenTreatment(true); }}
                              >
                                Treat
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => { setSelectedAdmission(adm); setOpenDischarge(true); }}
                              >
                                Discharge
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Discharged</Typography>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {admissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No admissions logs currently active.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {pagination.pages > 1 && (
            <Box display="flex" justifyContent="center" p={3}>
              <Pagination count={pagination.pages} page={page} onChange={(e, val) => setPage(val)} color="primary" />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Intake Dialog Modal */}
      <Dialog open={openIntake} onClose={() => setOpenIntake(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>Admit Inpatient Patient</DialogTitle>
        <form onSubmit={handleIntakeSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              select
              label="Select Patient"
              fullWidth
              required
              value={intakeData.patientId}
              onChange={(e) => setIntakeData({ ...intakeData, patientId: e.target.value })}
            >
              {patients.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.patientId})</MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Select Room"
                  fullWidth
                  required
                  value={intakeData.roomId}
                  onChange={handleRoomSelect}
                >
                  {rooms.map(r => (
                    <MenuItem key={r._id} value={r._id}>Room {r.roomNumber} ({r.roomType})</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Select Vacant Bed"
                  fullWidth
                  required
                  disabled={!intakeData.roomId}
                  value={intakeData.bedId}
                  onChange={(e) => setIntakeData({ ...intakeData, bedId: e.target.value })}
                >
                  {beds.map(b => (
                    <MenuItem key={b._id} value={b._id}>Bed {b.bedNumber}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Reason for Admission"
              fullWidth
              required
              multiline
              rows={2}
              value={intakeData.reason}
              onChange={(e) => setIntakeData({ ...intakeData, reason: e.target.value })}
            />

            <TextField
              label="Preliminary Diagnosis"
              fullWidth
              value={intakeData.diagnosis}
              onChange={(e) => setIntakeData({ ...intakeData, diagnosis: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenIntake(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Confirm Intake</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Vitals Modal */}
      <Dialog open={openVitals} onClose={() => setOpenVitals(false)}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>Log Clinical Vitals</DialogTitle>
        <form onSubmit={handlePostVitals}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Blood Pressure (SBP/DBP)" fullWidth value={bp} onChange={(e) => setBp(e.target.value)} required />
            <TextField label="Heart Rate (BPM)" type="number" fullWidth value={hr} onChange={(e) => setHr(e.target.value)} required />
            <TextField label="Body Temperature (°F)" type="number" fullWidth value={temp} onChange={(e) => setTemp(e.target.value)} required />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenVitals(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Vitals</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Treatment Modal */}
      <Dialog open={openTreatment} onClose={() => setOpenTreatment(false)}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>Record Treatment Note</DialogTitle>
        <form onSubmit={handlePostTreatment}>
          <DialogContent>
            <TextField
              label="Daily Rounds Note / Medication Administered"
              fullWidth
              multiline
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTreatment(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Log Entry</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Discharge Modal */}
      <Dialog open={openDischarge} onClose={() => setOpenDischarge(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>Approve Patient Discharge</DialogTitle>
        <form onSubmit={handlePostDischarge}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              select
              label="Condition at Discharge"
              fullWidth
              value={dischargeCond}
              onChange={(e) => setDischargeCond(e.target.value)}
              required
            >
              <MenuItem value="Stable">Stable / Recovered</MenuItem>
              <MenuItem value="Improved">Improved</MenuItem>
              <MenuItem value="Referred">Referred to Specialist</MenuItem>
            </TextField>

            <TextField
              label="Treatment Summary Overview"
              fullWidth
              multiline
              rows={3}
              value={dischargeSum}
              onChange={(e) => setDischargeSum(e.target.value)}
              required
            />

            <TextField
              label="Follow-Up Guidelines & Checklists"
              fullWidth
              multiline
              rows={2}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenDischarge(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="error">Approve Discharge</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdmissionDashboard;
