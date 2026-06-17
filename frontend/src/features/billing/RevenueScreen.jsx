import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Grid } from '@mui/material';
import { Timeline, AttachMoney, Paid } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance.js';

export const RevenueScreen = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPaymentsLog = async () => {
      setLoading(true);
      try {
        // Find payments directly from payment collection or billing stats
        const response = await axiosInstance.get('/billing/invoices?limit=50');
        // Retrieve payments from invoices payments logs, or fetch a mock ledger
        const invoicesList = response.data.data.invoices || [];
        
        // Simulating ledger rows from invoices
        const ledger = [];
        invoicesList.forEach(inv => {
          if (inv.amountPaid > 0) {
            ledger.push({
              id: inv._id,
              invoiceId: inv.invoiceId,
              patientName: `${inv.patientId?.firstName || 'System'} ${inv.patientId?.lastName || 'Patient'}`,
              amount: inv.amountPaid,
              method: inv.insuranceDetails?.status === 'Approved' ? 'Insurance' : 'UPI / Card',
              date: inv.updatedAt
            });
          }
        });
        setPayments(ledger);
      } catch (err) {
        console.error('Failed to load ledger', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentsLog();
  }, []);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <AttachMoney color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            Hospital Revenue Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Auditing payments logs and settled transaction receipts
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>Ledger Count</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{payments.length} Settlements</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>Aggregated Intake</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                ${totalCollected.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
                    <TableCell sx={{ fontWeight: 'bold' }}>Settle Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Related Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Settlement Method</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Intake Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(p.date).toLocaleString()}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.invoiceId}</TableCell>
                      <TableCell>{p.patientName}</TableCell>
                      <TableCell>
                        <Chip label={p.method} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>+${p.amount}</TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No transactions recorded in the ledger yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RevenueScreen;
