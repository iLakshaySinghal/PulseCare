import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Grid, Card, CardContent, Tabs, Tab, Paper, CircularProgress, LinearProgress, Divider } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { BarChart as AnalyticsIcon, TrendingUp, Hotel, AccessTime, SmartToy } from '@mui/icons-material';
import { fetchExecutiveMetrics, fetchRevenueMetrics, fetchOperationalMetrics, fetchDepartmentalMetrics } from './analyticsSlice.js';

// Color palette for charts
const COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

export const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { executive, revenue, operational, departmental } = useSelector(state => state.analytics);

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Load all data on mount
    dispatch(fetchExecutiveMetrics());
    dispatch(fetchRevenueMetrics());
    dispatch(fetchOperationalMetrics());
    dispatch(fetchDepartmentalMetrics());
  }, [dispatch]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const isExecutiveLoading = executive.loading || revenue.loading || operational.loading || departmental.loading;

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <AnalyticsIcon color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            System Performance Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            HIPAA-compliant analytical audits of hospital throughputs, financials, and operations
          </Typography>
        </Box>
      </Box>

      {/* Tabs Menu */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          mb: 4,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          '& .MuiTab-root': { fontFamily: 'Outfit', fontWeight: 600, textTransform: 'none' }
        }}
      >
        <Tab label="Executive Summary" />
        <Tab label="Revenue & Invoicing" />
        <Tab label="Inpatient & Demographics" />
        <Tab label="Department Utilization" />
      </Tabs>

      {isExecutiveLoading && (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      )}

      {!isExecutiveLoading && (
        <Box>
          {/* TAB 0: EXECUTIVE SUMMARY */}
          {activeTab === 0 && executive.data && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AvatarIcon icon={<TrendingUp />} color="#6366f1" />
                    <Box>
                      <Typography color="text.secondary" variant="body2">Total Collected Revenue</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        ₹{executive.data.totalRevenue?.toLocaleString() || '0'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AvatarIcon icon={<Hotel />} color="#ec4899" />
                    <Box>
                      <Typography color="text.secondary" variant="body2">Active Admitted Inpatients</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {executive.data.activeAdmissions || '0'} Patients
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AvatarIcon icon={<AccessTime />} color="#0ea5e9" />
                    <Box>
                      <Typography color="text.secondary" variant="body2">Total Booking Volume</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {executive.data.totalAppointments || '0'} Bookings
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AvatarIcon icon={<SmartToy />} color="#10b981" />
                    <Box>
                      <Typography color="text.secondary" variant="body2">AI Query Success Rate</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {executive.data.aiSuccessRate || '100'}% Success
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Progress meters for operational capacities */}
              {operational.data && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                        Bed Occupancy Ratio
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={1} mt={2}>
                        <Typography variant="body2">
                          Occupied: <strong>{operational.data.bedOccupancy?.occupiedBeds}</strong> / {operational.data.bedOccupancy?.totalBeds} beds
                        </Typography>
                        <Typography variant="body2" color="primary.light">
                          {operational.data.bedOccupancy?.occupancyRate}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={operational.data.bedOccupancy?.occupancyRate || 0}
                        sx={{ height: 10, borderRadius: 2 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {departmental.data && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                        Booking Retention Ratios
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={1} mt={2}>
                        <Typography variant="body2">
                          Appointment Cancellation Rate:
                        </Typography>
                        <Typography variant="body2" color="error.light">
                          {departmental.data.cancellationRate}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={departmental.data.cancellationRate || 0}
                        color="error"
                        sx={{ height: 10, borderRadius: 2 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {/* TAB 1: REVENUE & INVOICING */}
          {activeTab === 1 && revenue.data && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent sx={{ height: 350 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                      Daily Cash Settlements (Past 30 Days)
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={revenue.data.dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent sx={{ height: 350 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                      Department Share Breakdown
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={revenue.data.departmentalRevenue}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {revenue.data.departmentalRevenue?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <Legend verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ height: 320 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                      Monthly Fiscal Inflows Trend (Full Year)
                    </Typography>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={revenue.data.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TAB 2: INPATIENT & DEMOGRAPHICS */}
          {activeTab === 2 && operational.data && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent sx={{ height: 350 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                      Patient Demographic distribution (Age Groups)
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={operational.data.ageDemographics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent sx={{ height: 350 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                      Patient Gender Proportions
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={operational.data.genderDemographics}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                          dataKey="value"
                        >
                          {operational.data.genderDemographics?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <Legend verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TAB 3: DEPARTMENT UTILIZATION */}
          {activeTab === 3 && departmental.data && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent sx={{ height: 350 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                      Laboratory Scanning Orders (By Scan Type)
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={departmental.data.laboratoryVolume}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent sx={{ height: 350 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                      Emergency Triage Priority Load
                    </Typography>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={departmental.data.emergencyPriorityDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="priority" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

// Internal Helper for Avatar Icon styling
const AvatarIcon = ({ icon, color }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 48,
      borderRadius: '50%',
      backgroundColor: `${color}20`,
      color: color
    }}
  >
    {icon}
  </Box>
);

export default AnalyticsDashboard;
