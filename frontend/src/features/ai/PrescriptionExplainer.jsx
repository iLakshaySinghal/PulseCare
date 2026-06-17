import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, TextField, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Alert, CircularProgress, Paper, Divider } from '@mui/material';
import { Description, HelpOutline, Warning, Help, LocalPharmacy, PlayArrow } from '@mui/icons-material';
import { explainPrescription } from './aiSlice.js';

export const PrescriptionExplainer = () => {
  const dispatch = useDispatch();
  const { prescriptionExplainer } = useSelector(state => state.ai);
  const { loading, data, error } = prescriptionExplainer;

  const [medData, setMedData] = useState({
    medicineName: '',
    patientQuery: ''
  });

  const handleChange = (e) => {
    setMedData({ ...medData, [e.target.name]: e.target.value });
  };

  const handleQuickSelect = (name) => {
    setMedData({ ...medData, medicineName: name });
  };

  const handleExplain = (e) => {
    e.preventDefault();
    dispatch(explainPrescription(medData));
  };

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <LocalPharmacy color="secondary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            AI Prescription Explainer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Translate complex pharmacology and doctor instructions into clear, everyday guidance
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Form Panel */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                Query Prescription details
              </Typography>
              
              <Box mb={3}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Quick select common medications:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {['Paracetamol 500mg', 'Amoxicillin 250mg', 'Metformin 850mg'].map((med) => (
                    <Button
                      key={med}
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleQuickSelect(med)}
                      sx={{ fontSize: '0.75rem', py: 0.5 }}
                    >
                      {med}
                    </Button>
                  ))}
                </Box>
              </Box>

              <form onSubmit={handleExplain}>
                <Box display="flex" flexDirection="column" gap={3}>
                  <TextField
                    name="medicineName"
                    label="Medication Name / Dosage"
                    fullWidth
                    required
                    value={medData.medicineName}
                    onChange={handleChange}
                    placeholder="e.g. Paracetamol 500mg"
                  />

                  <TextField
                    name="patientQuery"
                    label="What is your question? (Optional)"
                    multiline
                    rows={4}
                    fullWidth
                    value={medData.patientQuery}
                    onChange={handleChange}
                    placeholder="e.g. 'Can I take this on an empty stomach?', 'What should I do if I miss a dose?'"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    disabled={loading}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Explain Prescription'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={7}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          
          {!loading && !data && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
              minHeight={300}
              component={Paper}
              variant="outlined"
              sx={{ borderStyle: 'dashed', opacity: 0.8 }}
            >
              <HelpOutline sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                Submit a medication query to view dosage, precautions, and instructions.
              </Typography>
            </Box>
          )}

          {loading && (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" minHeight={300}>
              <CircularProgress size={50} sx={{ mb: 2 }} color="secondary" />
              <Typography color="text.secondary">Consulting pharmacology base...</Typography>
            </Box>
          )}

          {data && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                  Pharmacist Guidance Sheets
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Instruction details for {medData.medicineName}
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Box mb={3}>
                  <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayArrow sx={{ fontSize: 16 }} /> Dosage & Admin Directions
                  </Typography>
                  <Typography variant="body2" sx={{ pl: 3, lineHeight: 1.6 }}>
                    {data.dosageInstructions}
                  </Typography>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayArrow sx={{ fontSize: 16 }} /> Side Effects to Monitor
                  </Typography>
                  <List size="small" sx={{ pl: 3, py: 0 }}>
                    {data.sideEffects?.map((effect, idx) => (
                      <ListItem key={idx} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24, color: 'text.secondary' }}>•</ListItemIcon>
                        <ListItemText primary={effect} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle1" color="error" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning sx={{ fontSize: 16 }} /> Critical Warnings & Safety Rules
                  </Typography>
                  <List size="small" sx={{ pl: 3, py: 0 }}>
                    {data.safetyWarnings?.map((warning, idx) => (
                      <ListItem key={idx} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24, color: 'error.main' }}>•</ListItemIcon>
                        <ListItemText primary={warning} primaryTypographyProps={{ variant: 'body2', color: 'error.light' }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box>
                  <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayArrow sx={{ fontSize: 16 }} /> Lifestyle & Diet Advice
                  </Typography>
                  <List size="small" sx={{ pl: 3, py: 0 }}>
                    {data.lifestyleRecommendations?.map((rec, idx) => (
                      <ListItem key={idx} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24, color: 'success.main' }}>•</ListItemIcon>
                        <ListItemText primary={rec} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrescriptionExplainer;
