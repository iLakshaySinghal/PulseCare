import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, FormControlLabel, TextField, Alert, CircularProgress, MenuItem, Chip, Divider } from '@mui/material';
import { Receipt, Search, DoneAll, History } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance.js';
import { fetchUnbilledItems, generateInvoice } from './billingSlice.js';

export const InvoiceGenerator = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { unbilledItems, loading, error } = useSelector(state => state.billing);

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  
  // Selection states for billing items
  const [selectedItems, setSelectedItems] = useState({});

  useEffect(() => {
    // Fetch patients list for dropdown selector
    const fetchPatientsList = async () => {
      try {
        const response = await axiosInstance.get('/patients?limit=50');
        setPatients(response.data.data.patients || []);
      } catch (err) {
        console.error('Failed to load patients list', err);
      }
    };
    fetchPatientsList();
  }, []);

  const handlePatientSelect = (e) => {
    const val = e.target.value;
    setSelectedPatientId(val);
    if (val) {
      dispatch(fetchUnbilledItems(val));
    }
  };

  // Sync selected checkboxes when unbilledItems load
  useEffect(() => {
    const defaultSelections = {};
    unbilledItems.forEach((item, idx) => {
      defaultSelections[idx] = true;
    });
    setSelectedItems(defaultSelections);
  }, [unbilledItems]);

  const handleCheckboxToggle = (idx) => {
    setSelectedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getFilteredBillingItems = () => {
    return unbilledItems.filter((_, idx) => !!selectedItems[idx]);
  };

  const calculateSubtotal = () => {
    return getFilteredBillingItems().reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleGenerate = async () => {
    const items = getFilteredBillingItems();
    if (items.length === 0) return;

    const invoiceData = {
      patientId: selectedPatientId,
      items,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0
    };

    const resultAction = await dispatch(generateInvoice(invoiceData));
    if (generateInvoice.fulfilled.match(resultAction)) {
      navigate('/billing');
    }
  };

  const subTotal = calculateSubtotal();
  const grandTotal = Math.max(0, subTotal + parseFloat(tax || 0) - parseFloat(discount || 0));

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <Receipt color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            Generate Medical Invoice
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compile outstanding department balances and issues patient invoices
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Patient Selection Selector */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                Patient Assignment
              </Typography>
              
              <TextField
                select
                fullWidth
                label="Select Intake Profile"
                value={selectedPatientId}
                onChange={handlePatientSelect}
                sx={{ mb: 3 }}
              >
                <MenuItem value="">-- Select Patient Profile --</MenuItem>
                {patients.map(p => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.firstName} {p.lastName} ({p.patientId})
                  </MenuItem>
                ))}
              </TextField>

              {selectedPatientId && unbilledItems.length === 0 && !loading && (
                <Alert severity="info" icon={<History />} sx={{ borderRadius: 2 }}>
                  This patient does not have any pending unbilled charges in their records.
                </Alert>
              )}

              {selectedPatientId && unbilledItems.length > 0 && (
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="Apply Discount (₹)"
                    type="number"
                    fullWidth
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <TextField
                    label="Add Tax Charges (₹)"
                    type="number"
                    fullWidth
                    value={tax}
                    onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  />

                  <Paper p={2} sx={{ p: 2, backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Subtotal:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{subTotal}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Tax:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{tax}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Discount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>-₹{discount}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Grand Total:</Typography>
                      <Typography variant="subtitle2" color="primary.light" sx={{ fontWeight: 'bold' }}>
                        ₹{grandTotal}
                      </Typography>
                    </Box>
                  </Paper>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleGenerate}
                    disabled={getFilteredBillingItems().length === 0}
                    sx={{ py: 1.2 }}
                  >
                    Generate Invoice Receipt
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Unbilled Items Table */}
        <Grid item xs={12} md={8}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress />
            </Box>
          ) : (
            selectedPatientId && unbilledItems.length > 0 && (
              <Card>
                <CardContent sx={{ p: 0 }}>
                  <Box p={2} display="flex" alignItems="center" gap={1}>
                    <DoneAll color="primary" />
                    <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                      Outstanding Department Balances
                    </Typography>
                  </Box>
                  <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width={50}></TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Source Dept</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Unit Price</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Total Cost</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {unbilledItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Checkbox
                                checked={!!selectedItems[idx]}
                                onChange={() => handleCheckboxToggle(idx)}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label={item.source} size="small" variant="outlined" color="primary" />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>₹{item.unitPrice}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>₹{item.totalPrice}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceGenerator;
