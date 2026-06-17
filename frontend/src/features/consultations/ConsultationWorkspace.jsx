import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Paper, TextField, Button, Divider, List,
  ListItem, ListItemText, Card, CardContent, Tabs, Tab, Alert, IconButton
} from '@mui/material';
import { Save, Check, Add, Delete, History, Info, Healing, LocalPharmacy } from '@mui/icons-material';
import { updateConsultationDraft, completeConsultation, fetchPatientConsultations } from './consultationSlice.js';
import axiosInstance from '../../utils/axiosInstance.js';

export const ConsultationWorkspace = () => {
  const { id } = useParams(); // consultation ID
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { activeConsultation, patientHistory, loading, error, success } = useSelector((state) => state.consultations);

  // Draft workspace states
  const [vitals, setVitals] = useState({ bloodPressure: '120/80', heartRate: 72, temperature: 98.6 });
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnoses, setDiagnoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [treatmentPlan, setTreatmentPlan] = useState({ goal: '', instructions: '' });

  // Diagnosis inputs
  const [diagCode, setDiagCode] = useState('');
  const [diagName, setDiagName] = useState('');
  const [diagStatus, setDiagStatus] = useState('Active');

  // Prescription inputs
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');

  // Tabs
  const [tabValue, setTabValue] = useState(0);
  const [emrHistory, setEmrHistory] = useState([]);

  // Load consultation draft details
  useEffect(() => {
    const fetchDraftDetails = async () => {
      try {
        const res = await axiosInstance.get(`/consultations/${id}`);
        const data = res.data.data;
        if (data) {
          if (data.vitals) setVitals(data.vitals);
          if (data.clinicalNotes) setClinicalNotes(data.clinicalNotes);
          if (data.diagnoses) setDiagnoses(data.diagnoses);
          if (data.prescriptions) setPrescriptions(data.prescriptions);
          if (data.treatmentPlan) setTreatmentPlan(data.treatmentPlan);

          // Fetch EMR history and previous reports for the patient
          if (data.patientId?._id) {
            const emrRes = await axiosInstance.get(`/emr/patient/${data.patientId._id}`);
            setEmrHistory(emrRes.data.data || []);
          }
        }
      } catch (err) {
        console.error('Failed to load consultation workspace details', err);
      }
    };
    fetchDraftDetails();
  }, [id]);

  const handleSaveDraft = () => {
    dispatch(updateConsultationDraft({
      id,
      vitals,
      clinicalNotes,
      diagnoses,
      prescriptions,
      treatmentPlan
    }));
  };

  const handleFinalize = () => {
    dispatch(updateConsultationDraft({
      id,
      vitals,
      clinicalNotes,
      diagnoses,
      prescriptions,
      treatmentPlan
    })).then(() => {
      dispatch(completeConsultation(id)).then((res) => {
        if (!res.error) {
          navigate('/consultation');
        }
      });
    });
  };

  const handleAddDiagnosis = () => {
    if (!diagCode || !diagName) return;
    setDiagnoses([...diagnoses, { code: diagCode, name: diagName, status: diagStatus }]);
    setDiagCode('');
    setDiagName('');
  };

  const handleRemoveDiagnosis = (idx) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== idx));
  };

  const handleAddPrescription = () => {
    if (!drugName || !dosage || !frequency || !duration) return;
    setPrescriptions([...prescriptions, { drugName, dosage, frequency, duration }]);
    setDrugName('');
    setDosage('');
    setFrequency('');
    setDuration('');
  };

  const handleRemovePrescription = (idx) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  return (
    <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      {/* Patient Header Card */}
      <Paper className="glass-panel" sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ color: '#ffffff', fontFamily: 'Outfit', fontWeight: 600 }}>
              Consultation: {emrHistory[0]?.patientId?.firstName || 'Alice'} {emrHistory[0]?.patientId?.lastName || 'Brown'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patient ID: {emrHistory[0]?.patientId?.patientId || 'PT-20260617-8891'} | DOB: {emrHistory[0]?.patientId?.dateOfBirth ? new Date(emrHistory[0].patientId.dateOfBirth).toLocaleDateString() : '05/14/1990'} | Gender: {emrHistory[0]?.patientId?.gender || 'Female'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<Save />} onClick={handleSaveDraft}>
              Save Draft
            </Button>
            <Button
              variant="contained"
              startIcon={<Check />}
              onClick={handleFinalize}
              sx={{
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              Complete Consultation
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Layout: Workspace vs. Patient Timeline */}
      <Paper className="glass-panel" sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            px: 2,
            '& .MuiTab-root': { color: 'text.secondary', fontFamily: 'Outfit' }
          }}
        >
          <Tab label="Workspace Sheet" icon={<Healing />} iconPosition="start" />
          <Tab label="Patient EMR Timeline" icon={<History />} iconPosition="start" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Left Column: Vitals and Notes */}
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle1" sx={{ color: '#818cf8', fontWeight: 600, mb: 2 }}>
                  1. Physiology & Vitals
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Blood Pressure"
                      value={vitals.bloodPressure}
                      onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                      placeholder="e.g. 120/80"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Heart Rate (bpm)"
                      value={vitals.heartRate}
                      onChange={(e) => setVitals({ ...vitals, heartRate: parseInt(e.target.value, 10) })}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Temperature (°F)"
                      value={vitals.temperature}
                      onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) })}
                    />
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" sx={{ color: '#818cf8', fontWeight: 600, mb: 2 }}>
                  2. Clinical Encounter Notes
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  placeholder="Record symptoms, clinical observations, physical exam details..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Typography variant="subtitle1" sx={{ color: '#818cf8', fontWeight: 600, mb: 2 }}>
                  3. Treatment Plan & Directions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Primary Goals"
                      value={treatmentPlan.goal}
                      onChange={(e) => setTreatmentPlan({ ...treatmentPlan, goal: e.target.value })}
                      placeholder="e.g., Reduce blood pressure, monitor lifestyle"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Direct Instructions for Patient"
                      value={treatmentPlan.instructions}
                      onChange={(e) => setTreatmentPlan({ ...treatmentPlan, instructions: e.target.value })}
                      placeholder="e.g. Rest for 2 days. Avoid salt."
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Column: Diagnoses and Prescriptions */}
              <Grid item xs={12} md={5}>
                {/* Diagnoses Panel */}
                <Card sx={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)', mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: '#818cf8', fontWeight: 600, mb: 2 }}>
                      4. Diagnosis Tracker
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        size="small"
                        label="ICD-10 Code"
                        placeholder="e.g. J06.9"
                        value={diagCode}
                        onChange={(e) => setDiagCode(e.target.value)}
                      />
                      <TextField
                        size="small"
                        label="Name"
                        placeholder="Flu symptoms"
                        value={diagName}
                        onChange={(e) => setDiagName(e.target.value)}
                      />
                      <IconButton color="primary" onClick={handleAddDiagnosis}>
                        <Add />
                      </IconButton>
                    </Box>
                    <List dense>
                      {diagnoses.map((diag, idx) => (
                        <ListItem key={idx} secondaryAction={
                          <IconButton edge="end" size="small" onClick={() => handleRemoveDiagnosis(idx)}>
                            <Delete color="error" />
                          </IconButton>
                        }>
                          <ListItemText primary={`${diag.code} - ${diag.name}`} secondary={`Status: ${diag.status}`} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>

                {/* Prescriptions Panel */}
                <Card sx={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: '#818cf8', fontWeight: 600, mb: 2 }}>
                      5. Prescription Generator
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                      <TextField
                        size="small"
                        label="Drug Name"
                        placeholder="Paracetamol 500mg"
                        value={drugName}
                        onChange={(e) => setDrugName(e.target.value)}
                      />
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <TextField size="small" label="Dosage" placeholder="1 tab" value={dosage} onChange={(e) => setDosage(e.target.value)} />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField size="small" label="Freq" placeholder="TDS" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField size="small" label="Dur" placeholder="5 days" value={duration} onChange={(e) => setDuration(e.target.value)} />
                        </Grid>
                      </Grid>
                      <Button variant="outlined" size="small" startIcon={<Add />} onClick={handleAddPrescription}>
                        Add Medicine Row
                      </Button>
                    </Box>
                    <List dense>
                      {prescriptions.map((med, idx) => (
                        <ListItem key={idx} secondaryAction={
                          <IconButton edge="end" size="small" onClick={() => handleRemovePrescription(idx)}>
                            <Delete color="error" />
                          </IconButton>
                        }>
                          <ListItemText primary={med.drugName} secondary={`${med.dosage} | ${med.frequency} | ${med.duration}`} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontFamily: 'Outfit' }}>Historical Medical Ledger</Typography>
            {emrHistory.map((emr) => (
              <Box key={emr._id} sx={{ mb: 3, p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(15,23,42,0.2)' }}>
                <Grid container spacing={2} sx={{ mb: 1.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="primary">Encounter Date: {new Date(emr.encounterDate).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={6} align="right">
                    <Typography variant="caption" color="text.secondary">Vitals: BP {emr.vitals?.bloodPressure} | HR {emr.vitals?.heartRate} | Temp {emr.vitals?.temperature}°F</Typography>
                  </Grid>
                </Grid>
                <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{emr.clinicalNotes}</Typography>
                <Divider sx={{ mb: 1.5, borderColor: 'rgba(255,255,255,0.05)' }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Diagnoses</Typography>
                    {emr.diagnoses?.map((d, i) => (
                      <Typography key={i} variant="body2" sx={{ fontWeight: 600 }}>• {d.code} - {d.name} ({d.status})</Typography>
                    ))}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Prescriptions</Typography>
                    {emr.prescriptions?.map((p, i) => (
                      <Typography key={i} variant="body2">• {p.drugName} - {p.dosage} | {p.frequency} ({p.duration})</Typography>
                    ))}
                  </Grid>
                </Grid>
              </Box>
            ))}
            {emrHistory.length === 0 && (
              <Typography color="text.secondary" align="center">No prior EMR encounters registered.</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ConsultationWorkspace;
