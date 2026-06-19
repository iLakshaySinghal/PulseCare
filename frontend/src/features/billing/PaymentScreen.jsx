import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, MenuItem, Chip, Alert, CircularProgress, Divider } from '@mui/material';
import { ReceiptLong, ArrowBack, AddCard, Verified, AccountBalance, Help } from '@mui/icons-material';
import { fetchInvoiceById, submitPayment, submitClaim, submitClaimApproval, resetPaymentSuccess } from './billingSlice.js';

export const PaymentScreen = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { currentInvoice, loading, error, paymentSuccess } = useSelector(state => state.billing);

  // Form states
  const [payMethod, setPayMethod] = useState('UPI');
  const [txRef, setTxRef] = useState('');
  const [payAmount, setPayAmount] = useState(0);

  // Insurance form states
  const [insProvider, setInsProvider] = useState('');
  const [insPolicy, setInsPolicy] = useState('');
  const [insAmount, setInsAmount] = useState(0);

  // Approval state
  const [approveStatus, setApproveStatus] = useState('Approved');
  const [approvedVal, setApprovedVal] = useState(0);

  useEffect(() => {
    dispatch(fetchInvoiceById(id));
    dispatch(resetPaymentSuccess());
  }, [dispatch, id]);

  // Sync default pay amount when invoice loads
  useEffect(() => {
    if (currentInvoice) {
      setPayAmount(currentInvoice.amountDue);
      setInsAmount(currentInvoice.amountDue);
      setApprovedVal(currentInvoice.insuranceDetails?.claimedAmount || currentInvoice.amountDue);
    }
  }, [currentInvoice]);

  const handlePayment = (e) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    dispatch(submitPayment({
      invoiceId: id,
      paymentMethod: payMethod,
      transactionReference: txRef,
      amount: parseFloat(payAmount)
    }));
  };

  const handleInsuranceClaim = (e) => {
    e.preventDefault();
    dispatch(submitClaim({
      invoiceId: id,
      providerName: insProvider,
      policyNumber: insPolicy,
      claimedAmount: parseFloat(insAmount)
    }));
  };

  const handleInsuranceApproval = (e) => {
    e.preventDefault();
    dispatch(submitClaimApproval({
      invoiceId: id,
      status: approveStatus,
      approvedAmount: parseFloat(approvedVal)
    }));
  };

  if (loading && !currentInvoice) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentInvoice) {
    return (
      <Box p={3}>
        <Alert severity="error">Invoice details not found.</Alert>
      </Box>
    );
  }

  const isBillingStaff = ['Super Admin', 'Hospital Admin', 'Billing Executive'].includes(user?.role);
  const canPay = currentInvoice.amountDue > 0;
  const isClaimSubmitted = currentInvoice.insuranceDetails?.status === 'Submitted';
  const isClaimed = ['Submitted', 'Approved', 'Rejected'].includes(currentInvoice.insuranceDetails?.status);

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <Button component={Link} to="/billing" startIcon={<ArrowBack />} variant="outlined" size="small">
          Back
        </Button>
        <Box display="flex" alignItems="center" gap={1}>
          <ReceiptLong color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
              Invoice {currentInvoice.invoiceId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review line items and complete payment processing
            </Typography>
          </Box>
        </Box>
      </Box>

      {paymentSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Payment recorded successfully!</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Invoice Summary and Table Items */}
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Patient Demographic Info</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {currentInvoice.patientId?.firstName} {currentInvoice.patientId?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patient ID: {currentInvoice.patientId?.patientId}
                  </Typography>
                </Box>
                <Box align="right">
                  <Typography variant="subtitle2" color="text.secondary">Billing Status</Typography>
                  <Chip label={currentInvoice.status} color={currentInvoice.status === 'Paid' ? 'success' : 'warning'} sx={{ fontWeight: 'bold' }} />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                Billed Department Items
              </Typography>
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none', mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Line Details</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentInvoice.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Chip label={item.source} size="small" variant="outlined" /></TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.unitPrice}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>₹{item.totalPrice}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ mb: 3 }} />

              <Box display="flex" flexDirection="column" gap={1} width="60%" marginLeft="auto">
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{currentInvoice.subTotal}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Tax:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{currentInvoice.tax}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>-₹{currentInvoice.discount}</Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Grand Total:</Typography>
                  <Typography variant="subtitle2" color="primary.light" sx={{ fontWeight: 'bold' }}>
                    ₹{currentInvoice.grandTotal}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>Amount Paid:</Typography>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                    ₹{currentInvoice.amountPaid}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>Amount Due:</Typography>
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    ₹{currentInvoice.amountDue}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Panel: Pay, Insurance Claims, or Insurance Approval */}
        <Grid item xs={12} md={5}>
          {/* Card 1: Settle Payments */}
          {canPay && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AddCard color="primary" />
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                    Process Payment Settle
                  </Typography>
                </Box>
                <form onSubmit={handlePayment}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                      select
                      label="Payment Method"
                      fullWidth
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      <MenuItem value="UPI">UPI Transfer</MenuItem>
                      <MenuItem value="Debit Card">Debit Card</MenuItem>
                      <MenuItem value="Credit Card">Credit Card</MenuItem>
                      <MenuItem value="Cash">Cash Settlement</MenuItem>
                    </TextField>

                    <TextField
                      label="Transaction Ref / Card Suffix"
                      fullWidth
                      value={txRef}
                      onChange={(e) => setTxRef(e.target.value)}
                      placeholder="e.g. TXN98726154"
                    />

                    <TextField
                      label="Amount to Pay (₹)"
                      type="number"
                      fullWidth
                      value={payAmount}
                      onChange={(e) => setPayAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                      helperText={`Outstanding due: ₹${currentInvoice.amountDue}`}
                    />

                    <Button type="submit" variant="contained" color="secondary" fullWidth sx={{ py: 1.2 }}>
                      Post Payment Transaction
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Card 2: Insurance Claims Operations */}
          {!isClaimed && canPay && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AccountBalance color="secondary" />
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                    Submit Insurance Claim
                  </Typography>
                </Box>
                <form onSubmit={handleInsuranceClaim}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                      label="Insurance Provider Name"
                      fullWidth
                      required
                      value={insProvider}
                      onChange={(e) => setInsProvider(e.target.value)}
                      placeholder="e.g. Blue Cross"
                    />
                    <TextField
                      label="Policy Number"
                      fullWidth
                      required
                      value={insPolicy}
                      onChange={(e) => setInsPolicy(e.target.value)}
                      placeholder="e.g. POL-9872-992"
                    />
                    <TextField
                      label="Claimed Amount (₹)"
                      type="number"
                      fullWidth
                      required
                      value={insAmount}
                      onChange={(e) => setInsAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                      helperText={`Outstanding due: ₹${currentInvoice.amountDue}`}
                    />
                    <Button type="submit" variant="outlined" color="secondary" fullWidth sx={{ py: 1.2 }}>
                      Submit Insurance Pre-Auth
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Card 3: Claim Status / Approval Controls (Staff only) */}
          {isClaimed && (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Verified color="success" />
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                    Insurance Claim Details
                  </Typography>
                </Box>
                <Box mb={2} p={2} component={Paper} variant="outlined">
                  <Typography variant="body2">Provider: <strong>{currentInvoice.insuranceDetails.providerName}</strong></Typography>
                  <Typography variant="body2">Policy No: <strong>{currentInvoice.insuranceDetails.policyNumber}</strong></Typography>
                  <Typography variant="body2">Claimed: <strong>₹{currentInvoice.insuranceDetails.claimedAmount}</strong></Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Status: <Chip label={currentInvoice.insuranceDetails.status} size="small" color={currentInvoice.insuranceDetails.status === 'Approved' ? 'success' : 'info'} />
                  </Typography>
                  {currentInvoice.insuranceDetails.status === 'Approved' && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      Approved Amount: <strong>₹{currentInvoice.insuranceDetails.approvedAmount}</strong>
                    </Typography>
                  )}
                </Box>

                {/* Approve Form for Billing Executive */}
                {isBillingStaff && isClaimSubmitted && (
                  <form onSubmit={handleInsuranceApproval}>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <TextField
                        select
                        label="Action"
                        fullWidth
                        value={approveStatus}
                        onChange={(e) => setApproveStatus(e.target.value)}
                      >
                        <MenuItem value="Approved">Approve Claim</MenuItem>
                        <MenuItem value="Rejected">Reject Claim</MenuItem>
                      </TextField>

                      {approveStatus === 'Approved' && (
                        <TextField
                          label="Approved Amount (₹)"
                          type="number"
                          fullWidth
                          value={approvedVal}
                          onChange={(e) => setApprovedVal(Math.max(0, parseFloat(e.target.value) || 0))}
                          helperText={`Claimed amount: ₹${currentInvoice.insuranceDetails.claimedAmount}`}
                        />
                      )}

                      <Button type="submit" variant="contained" color="success" fullWidth>
                        Process Insurance Status
                      </Button>
                    </Box>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentScreen;
