import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, Grid, TextField, MenuItem, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, Chip, IconButton, Alert, CircularProgress, Tooltip, Stack, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { Description, LocalHospital, CloudUpload, Add, ChevronRight, FilePresent, Download } from '@mui/icons-material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from 'recharts';
import axiosInstance from '../../utils/axiosInstance.js';

export const EMRManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get('patientId');

  // EMR state
  const [patient, setPatient] = useState(null);
  const [patientId, setPatientId] = useState(queryPatientId || '');
  const [emrHistory, setEmrHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Intake EMR Form state
  const [openIntake, setOpenIntake] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [vitals, setVitals] = useState({ bloodPressure: '120/80', heartRate: 72, temperature: 98.6 });
  const [diagnoses, setDiagnoses] = useState([{ code: 'J06.9', name: 'Acute upper respiratory infection', status: 'Active' }]);
  const [prescriptions, setPrescriptions] = useState([{ drugName: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '5 days' }]);
  
  // File upload state
  const [uploadingEncounterId, setUploadingEncounterId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchPatientInfo = async (pid) => {
    try {
      const response = await axiosInstance.get(`/patients/${pid}`);
      setPatient(response.data.data);
    } catch (err) {
      console.error('Failed to load patient demographics:', err);
    }
  };

  const fetchEMRHistory = async (pid) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axiosInstance.get(`/emr/patient/${pid}`);
      setEmrHistory(response.data.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load medical records timeline');
    } finally {
      setLoading(false);
    }
  };

  // On page mount or patient change
  useEffect(() => {
    if (user.role === 'Patient') {
      // Patients look up their own profile automatically
      const loadPatientSelf = async () => {
        setLoading(true);
        try {
          const res = await axiosInstance.get('/patients');
          const myProfile = res.data.data.patients.find(p => p.userId === user.id);
          if (myProfile) {
            setPatient(myProfile);
            setPatientId(myProfile._id);
            fetchEMRHistory(myProfile._id);
          }
        } catch (err) {
          setErrorMsg('Failed to locate your patient profile');
        } finally {
          setLoading(false);
        }
      };
      loadPatientSelf();
    } else if (patientId) {
      fetchPatientInfo(patientId);
      fetchEMRHistory(patientId);
    }
  }, [patientId, user]);

  const handleAddDiagnosis = () => {
    setDiagnoses([...diagnoses, { code: '', name: '', status: 'Active' }]);
  };

  const handleRemoveDiagnosis = (index) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const handleDiagnosisChange = (index, field, val) => {
    const updated = [...diagnoses];
    updated[index][field] = val;
    setDiagnoses(updated);
  };

  const handleAddPrescription = () => {
    setPrescriptions([...prescriptions, { drugName: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemovePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index, field, val) => {
    const updated = [...prescriptions];
    updated[index][field] = val;
    setPrescriptions(updated);
  };

  const handleEMRSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        patientId,
        vitals,
        clinicalNotes,
        diagnoses,
        prescriptions: prescriptions.filter(p => p.drugName)
      };

      await axiosInstance.post('/emr', payload);
      setOpenIntake(false);
      setClinicalNotes('');
      setVitals({ bloodPressure: '120/80', heartRate: 72, temperature: 98.6 });
      setDiagnoses([{ code: 'J06.9', name: 'Acute upper respiratory infection', status: 'Active' }]);
      setPrescriptions([{ drugName: '', dosage: '', frequency: '', duration: '' }]);
      
      fetchEMRHistory(patientId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to submit clinical note.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadAttachment = async (encounterId) => {
    if (!selectedFile) return;
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axiosInstance.post(`/emr/${encounterId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFile(null);
      setUploadingEncounterId(null);
      fetchEMRHistory(patientId);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Attachment upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Compile Recharts Trend Data
  const chartData = [...emrHistory]
    .reverse()
    .map((entry) => ({
      date: new Date(entry.encounterDate).toLocaleDateString(),
      HR: entry.vitals.heartRate,
      Temp: entry.vitals.temperature
    }));

  const isClinician = ['Doctor', 'Nurse'].includes(user.role);
  const isAttachmentWriter = ['Doctor', 'Nurse', 'Lab Technician'].includes(user.role);

  return (
    <Box p={3}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Description color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
              Electronic Medical Records (EMR)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review clinical logs, verify physiological vitals, and view reports
            </Typography>
          </Box>
        </Box>

        {isClinician && patient && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<LocalHospital />}
            onClick={() => setOpenIntake(true)}
            sx={{ px: 3, py: 1 }}
          >
            Create Encounter Entry
          </Button>
        )}
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      {patient && (
        <Grid container spacing={4}>
          {/* Patient Demographic Summary Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" color="primary" sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                  Patient Profile Card
                </Typography>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">Patient Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{patient.lastName}, {patient.firstName}</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Patient ID</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#818cf8' }}>{patient.patientId}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Blood Group</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{patient.bloodGroup || '—'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">DOB</Typography>
                    <Typography variant="body2">{new Date(patient.dateOfBirth).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Gender</Typography>
                    <Typography variant="body2">{patient.gender}</Typography>
                  </Grid>
                </Grid>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>Allergies</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {patient.allergies?.map((a) => (
                      <Chip key={a} label={a} color="error" size="small" variant="outlined" />
                    ))}
                    {(!patient.allergies || patient.allergies.length === 0) && (
                      <Typography variant="body2" color="text.secondary">No known allergies registered.</Typography>
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* Vitals Trends Chart Panel */}
            {chartData.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" color="secondary" sx={{ fontFamily: 'Outfit', fontWeight: 600, mb: 2 }}>
                    Vitals Analytics Timeline
                  </Typography>
                  <Box height={250} width="100%">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                        <ChartTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="HR" name="HR (bpm)" stroke="#6366f1" activeDot={{ r: 6 }} strokeWidth={2} />
                        <Line type="monotone" dataKey="Temp" name="Temp (°F)" stroke="#ec4899" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Historical EMR timeline */}
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ fontFamily: 'Outfit', fontWeight: 700, mb: 3 }}>
              Clinical History Timeline
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
            ) : emrHistory.length === 0 ? (
              <Card sx={{ py: 6, textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="body1" color="text.secondary">
                    No clinical logs exist in the timeline for this patient file.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box display="flex" flexDirection="column" gap={4}>
                {emrHistory.map((entry) => (
                  <Card key={entry._id} className="glass-panel" sx={{ position: 'relative' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#818cf8', fontFamily: 'Outfit' }}>
                            Visit: {new Date(entry.encounterDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Logged by: {entry.providerId?.firstName} {entry.providerId?.lastName} ({entry.providerId?.role})
                          </Typography>
                        </Box>
                        
                        {isAttachmentWriter && (
                          <Box display="flex" alignItems="center" gap={1.5}>
                            {uploadingEncounterId === entry._id ? (
                              <Box display="flex" alignItems="center" gap={1}>
                                <input type="file" onChange={handleFileChange} style={{ fontSize: '12px', color: '#94a3b8' }} />
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleUploadAttachment(entry._id)}
                                  disabled={uploadLoading || !selectedFile}
                                >
                                  Upload
                                </Button>
                                <Button size="small" onClick={() => setUploadingEncounterId(null)}>Cancel</Button>
                              </Box>
                            ) : (
                              <Button
                                size="small"
                                startIcon={<CloudUpload />}
                                onClick={() => setUploadingEncounterId(entry._id)}
                              >
                                Attach File
                              </Button>
                            )}
                          </Box>
                        )}
                      </Box>

                      {/* Vitals Grid */}
                      <Grid container spacing={2} sx={{ mb: 2, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 2, p: 1.5 }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Blood Pressure</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.vitals.bloodPressure}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Heart Rate</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#38bdf8' }}>{entry.vitals.heartRate} bpm</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">Temperature</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f43f5e' }}>{entry.vitals.temperature} °F</Typography>
                        </Grid>
                      </Grid>

                      {/* Clinical Narrative Notes */}
                      <Box mb={2.5}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Clinical Assessment</Typography>
                        <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                          {entry.clinicalNotes}
                        </Typography>
                      </Box>

                      {/* Diagnostic ICD Codes */}
                      <Box mb={2.5}>
                        <Typography variant="subtitle2" color="secondary" gutterBottom sx={{ fontWeight: 'bold' }}>ICD-10 Diagnoses</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          {entry.diagnoses.map((d) => (
                            <Chip key={d.code} label={`${d.code}: ${d.name} (${d.status})`} color="secondary" variant="outlined" size="small" />
                          ))}
                        </Stack>
                      </Box>

                      {/* Prescriptions */}
                      {entry.prescriptions && entry.prescriptions.length > 0 && (
                        <Box mb={2.5}>
                          <Typography variant="subtitle2" color="success" gutterBottom sx={{ fontWeight: 'bold' }}>Rx Prescriptions</Typography>
                          <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(0,0,0,0.1)', border: 'none', boxShadow: 'none' }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontSize: '12px' }}>Drug Name</TableCell>
                                  <TableCell sx={{ fontSize: '12px' }}>Dosage</TableCell>
                                  <TableCell sx={{ fontSize: '12px' }}>Frequency</TableCell>
                                  <TableCell sx={{ fontSize: '12px' }}>Duration</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {entry.prescriptions.map((pr, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>{pr.drugName}</TableCell>
                                    <TableCell sx={{ fontSize: '12px' }}>{pr.dosage}</TableCell>
                                    <TableCell sx={{ fontSize: '12px' }}>{pr.frequency}</TableCell>
                                    <TableCell sx={{ fontSize: '12px' }}>{pr.duration}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {/* Attachments */}
                      {entry.attachments && entry.attachments.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="info" gutterBottom sx={{ fontWeight: 'bold' }}>Attached Lab Reports / Scans</Typography>
                          <Box display="flex" flexDirection="column" gap={1}>
                            {entry.attachments.map((file) => (
                              <Box
                                key={file._id}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ backgroundColor: 'rgba(255,255,255,0.03)', p: 1, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.05)' }}
                              >
                                <Box display="flex" alignItems="center" gap={1}>
                                  <FilePresent color="info" fontSize="small" />
                                  <Typography variant="body2" sx={{ fontSize: '13px' }}>{file.fileName}</Typography>
                                </Box>
                                <IconButton
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  color="info"
                                  size="small"
                                >
                                  <Download />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      )}

      {/* Clinical Encounter Intake Dialog */}
      <Dialog open={openIntake} onClose={() => setOpenIntake(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>Record Clinical Encounter</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleEMRSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="subtitle1" color="primary">Patient Physiological Vitals</Typography></Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Blood Pressure (SBP/DBP)"
                  fullWidth
                  required
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                  placeholder="120/80"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Heart Rate (bpm)"
                  type="number"
                  fullWidth
                  required
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: parseInt(e.target.value, 10) })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Temperature (°F)"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  fullWidth
                  required
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) })}
                />
              </Grid>

              <Grid item xs={12}><Typography variant="subtitle1" color="primary">Assessment Notes</Typography></Grid>
              <Grid item xs={12}>
                <TextField
                  label="Clinical Narrative / Diagnosis Assessment"
                  multiline
                  rows={4}
                  fullWidth
                  required
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" color="secondary">ICD-10 Diagnostic Codes</Typography>
                <Button size="small" startIcon={<Add />} onClick={handleAddDiagnosis}>Add Code</Button>
              </Grid>

              {diagnoses.map((d, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="ICD-10 Code"
                      fullWidth
                      required
                      value={d.code}
                      onChange={(e) => handleDiagnosisChange(index, 'code', e.target.value)}
                      placeholder="J06.9"
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Diagnosis Description"
                      fullWidth
                      required
                      value={d.name}
                      onChange={(e) => handleDiagnosisChange(index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Status"
                      select
                      fullWidth
                      required
                      value={d.status}
                      onChange={(e) => handleDiagnosisChange(index, 'status', e.target.value)}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Resolved">Resolved</MenuItem>
                      <MenuItem value="Suspected">Suspected</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={1} display="flex" alignItems="center">
                    <Button color="error" onClick={() => handleRemoveDiagnosis(index)} disabled={diagnoses.length === 1}>Remove</Button>
                  </Grid>
                </React.Fragment>
              ))}

              <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" color="success">Rx Prescriptions</Typography>
                <Button size="small" startIcon={<Add />} onClick={handleAddPrescription}>Add Rx</Button>
              </Grid>

              {prescriptions.map((p, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Drug Name"
                      fullWidth
                      value={p.drugName}
                      onChange={(e) => handlePrescriptionChange(index, 'drugName', e.target.value)}
                      placeholder="Paracetamol 500mg"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Dosage"
                      fullWidth
                      value={p.dosage}
                      onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                      placeholder="1 tablet"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Frequency"
                      fullWidth
                      value={p.frequency}
                      onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                      placeholder="Three times daily"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      label="Duration"
                      fullWidth
                      value={p.duration}
                      onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                      placeholder="5 days"
                    />
                  </Grid>
                  <Grid item xs={12} sm={1} display="flex" alignItems="center">
                    <Button color="error" onClick={() => handleRemovePrescription(index)} disabled={prescriptions.length === 1}>Remove</Button>
                  </Grid>
                </React.Fragment>
              ))}

              <Grid item xs={12} display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button onClick={() => setOpenIntake(false)}>Cancel</Button>
                <Button type="submit" variant="contained" color="primary">Save Chart Note</Button>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EMRManagement;
