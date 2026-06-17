import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, TextField, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Alert, CircularProgress, Paper, Divider } from '@mui/material';
import { InsertChart, Lightbulb, PlayArrow, Timeline, HelpOutline } from '@mui/icons-material';
import { getOperationsIntelligence } from './aiSlice.js';

export const OperationsIntelligence = () => {
  const dispatch = useDispatch();
  const { operationsIntelligence } = useSelector(state => state.ai);
  const { loading, data, error } = operationsIntelligence;

  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    dispatch(getOperationsIntelligence(query));
  };

  const handleQuickQuery = (qText) => {
    setQuery(qText);
    dispatch(getOperationsIntelligence(qText));
  };

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <InsertChart color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            Operations AI Intelligence
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Execute operational audit queries and retrieve strategic recommendations
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Queries Panel */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                Operations Query Engine
              </Typography>
              
              <Box mb={3} display="flex" flexDirection="column" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  Frequently audited topics:
                </Typography>
                {[
                  'Why did revenue decrease recently?',
                  'Which department performs best?',
                  'What is causing appointment delays?'
                ].map((q, idx) => (
                  <Button
                    key={idx}
                    variant="outlined"
                    size="small"
                    color="primary"
                    onClick={() => handleQuickQuery(q)}
                    sx={{ textTransform: 'none', justifyContent: 'flex-start', py: 0.8 }}
                  >
                    {q}
                  </Button>
                ))}
              </Box>

              <form onSubmit={handleSearch}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="Custom Audit Request"
                    multiline
                    rows={4}
                    fullWidth
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Describe specific parameters, e.g., 'Compare Cardiology and Pulmonology volumes and look for anomalies...'"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Run Intelligence Audit'}
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
                Submit an operational query or select a topic to retrieve insights.
              </Typography>
            </Box>
          )}

          {loading && (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" minHeight={300}>
              <CircularProgress size={50} sx={{ mb: 2 }} />
              <Typography color="text.secondary">Synthesizing billing, booking, and inpatient logs...</Typography>
            </Box>
          )}

          {data && (
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1 }}>
                  Operational Analytics Report
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Executive Insights Summary
                </Typography>

                <Divider sx={{ mb: 3 }} />

                {data.summaryText && (
                  <Box mb={4} p={2} sx={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', borderRadius: 2, borderLeft: '4px solid #6366f1' }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                      {data.summaryText}
                    </Typography>
                  </Box>
                )}

                <Grid container spacing={3}>
                  {/* Insights */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timeline sx={{ fontSize: 18 }} /> Core Financial & Delay Insights
                    </Typography>
                    <List size="small" sx={{ pl: 2, py: 0 }}>
                      {data.insights?.map((ins, idx) => (
                        <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 24, color: 'primary.light' }}>•</ListItemIcon>
                          <ListItemText primary={ins} primaryTypographyProps={{ variant: 'body2', lineHeight: 1.5 }} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  {/* Recommendations */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="success.main" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lightbulb sx={{ fontSize: 18 }} /> Strategic Recommendations
                    </Typography>
                    <List size="small" sx={{ pl: 2, py: 0 }}>
                      {data.recommendations?.map((rec, idx) => (
                        <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 24, color: 'success.main' }}>•</ListItemIcon>
                          <ListItemText primary={rec} primaryTypographyProps={{ variant: 'body2', lineHeight: 1.5 }} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  {/* Forecasts */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="secondary" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timeline sx={{ fontSize: 18 }} /> Seasonal & Capacity Forecasts
                    </Typography>
                    <List size="small" sx={{ pl: 2, py: 0 }}>
                      {data.forecasts?.map((fc, idx) => (
                        <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 24, color: 'secondary.light' }}>•</ListItemIcon>
                          <ListItemText primary={fc} primaryTypographyProps={{ variant: 'body2', lineHeight: 1.5 }} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OperationsIntelligence;
