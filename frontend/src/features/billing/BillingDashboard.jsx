import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, TextField, MenuItem, Chip, CircularProgress } from '@mui/material';
import { AccountBalanceWallet, Receipt, ReceiptLong, AddCard, Search } from '@mui/icons-material';
import { fetchInvoices } from './billingSlice.js';

export const BillingDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { invoices, pagination, loading } = useSelector(state => state.billing);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const isPatient = user?.role === 'Patient';
  const canGenerate = ['Super Admin', 'Hospital Admin', 'Billing Executive'].includes(user?.role);

  useEffect(() => {
    dispatch(fetchInvoices({ page, limit: 10, status, search }));
  }, [dispatch, page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    dispatch(fetchInvoices({ page: 1, limit: 10, status, search }));
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Paid': return 'success';
      case 'Partially Paid': return 'warning';
      case 'Refunded': return 'secondary';
      case 'Cancelled': return 'error';
      default: return 'info';
    }
  };

  // Quick summary stats
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalDue = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  return (
    <Box p={3}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
              Billing & Invoices Hub
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review transaction histories, process payments, and audit insurance claims
            </Typography>
          </Box>
        </Box>

        {canGenerate && (
          <Button
            component={Link}
            to="/billing/generate"
            variant="contained"
            color="primary"
            startIcon={<Receipt />}
          >
            Create New Invoice
          </Button>
        )}
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>Total Invoiced (This Page)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>${totalInvoiced.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>Total Settled (This Page)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>${totalPaid.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>Total Outstanding (This Page)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>${totalDue.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 2 }}>
          <form onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Invoice ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    endAdornment: <Search />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Unpaid">Unpaid</MenuItem>
                  <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                  <MenuItem value="Refunded">Refunded</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button type="submit" variant="outlined" fullWidth>
                  Filter Records
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* Table List */}
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Invoice ID</TableCell>
                    {!isPatient && <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>}
                    <TableCell sx={{ fontWeight: 'bold' }}>Grand Total</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Amount Paid</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Amount Due</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Insurance</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Issued Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell sx={{ fontWeight: 600 }}>{inv.invoiceId}</TableCell>
                      {!isPatient && (
                        <TableCell>
                          {inv.patientId?.firstName} {inv.patientId?.lastName}
                          <Typography variant="caption" display="block" color="text.secondary">
                            ID: {inv.patientId?.patientId}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell sx={{ fontWeight: 600 }}>${inv.grandTotal}</TableCell>
                      <TableCell color="success.main">${inv.amountPaid}</TableCell>
                      <TableCell color="warning.main">${inv.amountDue}</TableCell>
                      <TableCell>
                        <Chip label={inv.status} size="small" color={getStatusColor(inv.status)} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={inv.insuranceDetails?.status || 'Not Claimed'}
                          size="small"
                          variant="outlined"
                          color={inv.insuranceDetails?.status === 'Approved' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          component={Link}
                          to={`/billing/pay/${inv._id}`}
                          size="small"
                          variant="contained"
                          color={inv.amountDue > 0 ? 'secondary' : 'primary'}
                          startIcon={inv.amountDue > 0 ? <AddCard /> : <ReceiptLong />}
                        >
                          {inv.amountDue > 0 ? 'Settle / Details' : 'View Details'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No invoice billing records matched the filter criteria.
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
    </Box>
  );
};

export default BillingDashboard;
