import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Paper, Tabs, Tab, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Card, CardContent, Divider
} from '@mui/material';
import {
  LocalPharmacy, Add, CheckCircle, Warning, Search, ShoppingCart
} from '@mui/icons-material';
import {
  fetchMedicines, registerMedicine, fetchInventory, addStock,
  fetchDispensingQueue, dispensePrescription, receiveSocketPrescriptionAlert,
  receiveSocketPrescriptionDispensed
} from './pharmacySlice.js';
import { getSocket } from '../../utils/socket.js';

export const PharmacyDashboard = () => {
  const dispatch = useDispatch();
  const { medicines, inventory, dispensingQueue, loading } = useSelector((state) => state.pharmacy);

  const [tabValue, setTabValue] = useState(0);
  const [openRegister, setOpenRegister] = useState(false);
  const [openAddStock, setOpenAddStock] = useState(false);
  const [openDispense, setOpenDispense] = useState(false);
  
  // Register inputs
  const [medName, setMedName] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medForm, setMedForm] = useState('Tablet');
  const [medStrength, setMedStrength] = useState('');
  const [medManufacturer, setMedManufacturer] = useState('');

  // Add stock inputs
  const [selectedMed, setSelectedMed] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  // Dispense inputs
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dispensedItems, setDispensedItems] = useState([]);

  useEffect(() => {
    dispatch(fetchDispensingQueue());
    dispatch(fetchMedicines());
    dispatch(fetchInventory());

    const socket = getSocket();
    if (socket) {
      socket.on('new_prescription_available', (data) => {
        dispatch(receiveSocketPrescriptionAlert(data));
      });
      socket.on('prescription_dispensed', (data) => {
        dispatch(receiveSocketPrescriptionDispensed(data));
      });
      return () => {
        socket.off('new_prescription_available');
        socket.off('prescription_dispensed');
      };
    }
  }, [dispatch]);

  const handleRegister = () => {
    dispatch(registerMedicine({
      name: medName,
      genericName: medGeneric,
      form: medForm,
      strength: medStrength,
      manufacturer: medManufacturer
    })).then(() => {
      setOpenRegister(false);
      setMedName('');
      setMedGeneric('');
      dispatch(fetchMedicines());
    });
  };

  const handleAddStockSubmit = () => {
    dispatch(addStock({
      medicineId: selectedMed,
      stock: parseInt(stockQty, 10),
      expiryDate,
      supplier,
      batchNumber,
      unitPrice: parseFloat(unitPrice)
    })).then(() => {
      setOpenAddStock(false);
      setSelectedMed('');
      setStockQty('');
      setBatchNumber('');
      dispatch(fetchInventory());
    });
  };

  const handleOpenDispense = (prescription) => {
    setSelectedPrescription(prescription);
    // Auto-match prescriptions to inventory where possible
    const items = prescription.prescriptions.map(p => {
      // Find matching medicine ID in medicines master list
      const matched = medicines.find(m => m.name.toLowerCase().includes(p.drugName.toLowerCase()));
      return {
        drugName: p.drugName,
        medicineId: matched ? matched._id : '',
        quantity: 10, // Default dispatch quantity
        batchNumber: 'B1' // Default batch fallback
      };
    });
    setDispensedItems(items);
    setOpenDispense(true);
  };

  const handleDispenseSubmit = () => {
    if (!selectedPrescription) return;

    dispatch(dispensePrescription({
      emrId: selectedPrescription._id,
      dispensedMedicines: dispensedItems.map(i => ({
        medicineId: i.medicineId || medicines[0]?._id, // fallback
        quantity: i.quantity,
        batchNumber: i.batchNumber
      }))
    })).then((res) => {
      if (!res.error) {
        setOpenDispense(false);
        dispatch(fetchDispensingQueue());
        dispatch(fetchInventory());
      }
    });
  };

  return (
    <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#ffffff', fontFamily: 'Outfit' }}>
          Pharmacy Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setOpenRegister(true)}>
            Register Medicine
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAddStock(true)} sx={{ background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)' }}>
            Add Stock Batch
          </Button>
        </Box>
      </Box>

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
          <Tab label="Dispensing Queue" icon={<ShoppingCart />} iconPosition="start" />
          <Tab label="Inventory Stock Ledger" icon={<LocalPharmacy />} iconPosition="start" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Doctor</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Prescriptions List</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Date Issued</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dispensingQueue.map((presc) => (
                    <TableRow key={presc._id}>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {presc.patientId ? `${presc.patientId.firstName} ${presc.patientId.lastName}` : 'Unregistered'}
                      </TableCell>
                      <TableCell>
                        Dr. {presc.providerId ? `${presc.providerId.firstName} ${presc.providerId.lastName}` : 'Physician'}
                      </TableCell>
                      <TableCell>
                        {presc.prescriptions?.map((p, idx) => (
                          <Chip key={idx} label={`${p.drugName} (${p.dosage})`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </TableCell>
                      <TableCell>{new Date(presc.encounterDate).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Button variant="contained" size="small" sx={{ backgroundColor: '#10b981' }} onClick={() => handleOpenDispense(presc)}>
                          Verify & Dispense
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {dispensingQueue.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">Dispensing queue is currently empty.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Medicine Brand Name</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Generic Name</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Batch Number</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Current Stock</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Expiry Date</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Unit Price</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Alerts</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((inv) => {
                    const isLowStock = inv.stock <= (inv.reorderLevel || 10);
                    const isNearExpiry = new Date(inv.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                    return (
                      <TableRow key={inv._id}>
                        <TableCell sx={{ fontWeight: 600 }}>{inv.medicineId?.name}</TableCell>
                        <TableCell>{inv.medicineId?.genericName}</TableCell>
                        <TableCell>{inv.batchNumber}</TableCell>
                        <TableCell>{inv.stock}</TableCell>
                        <TableCell>{new Date(inv.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell>${inv.unitPrice}</TableCell>
                        <TableCell>
                          {isLowStock && <Chip icon={<Warning />} label="Low Stock" color="warning" size="small" sx={{ mr: 0.5 }} />}
                          {isNearExpiry && <Chip icon={<Warning />} label="Expiring Soon" color="error" size="small" />}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {inventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">No stock inventory logs recorded.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Register Medicine Dialog */}
      <Dialog open={openRegister} onClose={() => setOpenRegister(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register Medicine in Catalog</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <TextField label="Brand Name" fullWidth value={medName} onChange={(e) => setMedName(e.target.value)} />
            <TextField label="Generic Formula" fullWidth value={medGeneric} onChange={(e) => setMedGeneric(e.target.value)} />
            <FormControl fullWidth>
              <InputLabel>Formulation</InputLabel>
              <Select value={medForm} onChange={(e) => setMedForm(e.target.value)} label="Formulation">
                {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Other'].map(f => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Strength (e.g. 500mg)" fullWidth value={medStrength} onChange={(e) => setMedStrength(e.target.value)} />
            <TextField label="Manufacturer" fullWidth value={medManufacturer} onChange={(e) => setMedManufacturer(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRegister(false)}>Cancel</Button>
          <Button onClick={handleRegister} variant="contained" color="primary">Add to Catalog</Button>
        </DialogActions>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={openAddStock} onClose={() => setOpenAddStock(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Batch Stock to Inventory</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <FormControl fullWidth>
              <InputLabel>Medicine Brand</InputLabel>
              <Select value={selectedMed} onChange={(e) => setSelectedMed(e.target.value)} label="Medicine Brand">
                {medicines.map(m => (
                  <MenuItem key={m._id} value={m._id}>{m.name} ({m.genericName})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Batch Number" fullWidth value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
            <TextField label="Stock Quantity" type="number" fullWidth value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
            <TextField label="Expiry Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            <TextField label="Supplier Name" fullWidth value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            <TextField label="Unit Price ($)" type="number" fullWidth value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddStock(false)}>Cancel</Button>
          <Button onClick={handleAddStockSubmit} variant="contained" color="primary">Add Stock</Button>
        </DialogActions>
      </Dialog>

      {/* Dispense verification Dialog */}
      <Dialog open={openDispense} onClose={() => setOpenDispense(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify & Dispense Prescription</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1.5 }}>
            <Typography variant="subtitle2" color="primary">Dispensing details for: {selectedPrescription?.patientId?.firstName} {selectedPrescription?.patientId?.lastName}</Typography>
            <Divider />
            {dispensedItems.map((item, idx) => (
              <Grid container spacing={2} key={idx} alignItems="center">
                <Grid item xs={4}>
                  <Typography variant="body2">{item.drugName}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Batch Number</InputLabel>
                    <Select
                      value={item.batchNumber}
                      onChange={(e) => {
                        const updated = [...dispensedItems];
                        updated[idx].batchNumber = e.target.value;
                        setDispensedItems(updated);
                      }}
                      label="Batch Number"
                    >
                      <MenuItem value="B1">Batch B1 (default)</MenuItem>
                      <MenuItem value="B2">Batch B2</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    size="small"
                    label="Qty"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...dispensedItems];
                      updated[idx].quantity = parseInt(e.target.value, 10);
                      setDispensedItems(updated);
                    }}
                  />
                </Grid>
              </Grid>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDispense(false)}>Cancel</Button>
          <Button onClick={handleDispenseSubmit} variant="contained" color="success">Dispense & Deduct Stock</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PharmacyDashboard;
