import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, Checkbox, FormControlLabel, TextField, Button, Grid, Chip, Alert, CircularProgress, Paper, Divider } from '@mui/material';
import { Healing, LocalHospital, Warning, Help } from '@mui/icons-material';
import { analyzeSymptoms } from './aiSlice.js';

export const SymptomAnalyzer = () => {
  const dispatch = useDispatch();
  const { symptomAnalyzer } = useSelector(state => state.ai);
  const { loading, data, error } = symptomAnalyzer;

  const [symptoms, setSymptoms] = useState({
    fever: false,
    headache: false,
    cough: false,
    chestPain: false,
    fatigue: false,
    additionalInfo: ''
  });

  const handleCheckboxChange = (e) => {
    setSymptoms({ ...symptoms, [e.target.name]: e.target.checked });
  };

  const handleTextChange = (e) => {
    setSymptoms({ ...symptoms, additionalInfo: e.target.value });
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    dispatch(analyzeSymptoms(symptoms));
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
      case 'high':
        return '#f43f5e'; // rose/red
      case 'medium':
        return '#f59e0b'; // amber
      default:
        return '#10b981'; // emerald
    }
  };

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <Healing color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            AI Symptom Analyzer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Input clinical indicators to identify risk thresholds and triage directions
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Input Form Panel */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                Select Indicators
              </Typography>
              <form onSubmit={handleAnalyze}>
                <Box display="flex" flexDirection="column" gap={1.5} mb={3}>
                  <FormControlLabel
                    control={<Checkbox name="fever" checked={symptoms.fever} onChange={handleCheckboxChange} />}
                    label="Fever / Elevated Temperature"
                  />
                  <FormControlLabel
                    control={<Checkbox name="headache" checked={symptoms.headache} onChange={handleCheckboxChange} />}
                    label="Headache / Migraine"
                  />
                  <FormControlLabel
                    control={<Checkbox name="cough" checked={symptoms.cough} onChange={handleCheckboxChange} />}
                    label="Persistent Coughing"
                  />
                  <FormControlLabel
                    control={<Checkbox name="chestPain" checked={symptoms.chestPain} onChange={handleCheckboxChange} />}
                    label="Chest Pain / Pressure"
                  />
                  <FormControlLabel
                    control={<Checkbox name="fatigue" checked={symptoms.fatigue} onChange={handleCheckboxChange} />}
                    label="Acute Fatigue / Muscle Weakness"
                  />
                </Box>

                <TextField
                  label="Additional Symptoms & Duration Details"
                  multiline
                  rows={4}
                  fullWidth
                  value={symptoms.additionalInfo}
                  onChange={handleTextChange}
                  placeholder="Describe details, e.g., 'severe sore throat for 3 days and breathing tightness...'"
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Run Clinical Analysis'}
                </Button>
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
              <Help sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                No active analysis. Select symptoms and click "Run Clinical Analysis" to populate metrics.
              </Typography>
            </Box>
          )}

          {loading && (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" minHeight={300}>
              <CircularProgress size={50} sx={{ mb: 2 }} />
              <Typography color="text.secondary">Orchestrating clinical prompts...</Typography>
            </Box>
          )}

          {data && (
            <Card sx={{ borderLeft: `6px solid ${getRiskColor(data.riskLevel)}` }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                      Diagnostic Assessment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Triage Recommendation Engine
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={`Risk: ${data.riskLevel}`}
                      sx={{
                        backgroundColor: `${getRiskColor(data.riskLevel)}22`,
                        color: getRiskColor(data.riskLevel),
                        fontWeight: 'bold',
                        border: `1px solid ${getRiskColor(data.riskLevel)}44`
                      }}
                    />
                    <Chip
                      label={data.urgencyLevel}
                      variant="outlined"
                      color={data.urgencyLevel?.includes('Emergency') || data.urgencyLevel?.includes('Urgent') ? 'error' : 'info'}
                    />
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Likely Clinical Conditions
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {data.possibleConditions?.map((cond, index) => (
                      <Chip key={index} label={cond} color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>

                <Box mb={3} display="flex" alignItems="center" gap={1}>
                  <LocalHospital color="primary" />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Recommended Intake Channel
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {data.recommendedDepartment}
                    </Typography>
                  </Box>
                </Box>

                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Clinical Analysis Rationale
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {data.explanation}
                  </Typography>
                </Box>

                {data.disclaimer && (
                  <Alert severity="warning" icon={<Warning />} sx={{ borderRadius: 2 }}>
                    {data.disclaimer}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SymptomAnalyzer;
