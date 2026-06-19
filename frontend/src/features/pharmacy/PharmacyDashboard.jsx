import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Paper, Tabs, Tab, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel,
  FormControl, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Card, CardContent, Divider, Alert
} from '@mui/material';
import {
  LocalPharmacy, Add, CheckCircle, Warning, Search, ShoppingCart
} from '@mui/icons-material';
import {
  fetchMedicines, registerMedicine, fetchInventory, addStock,
  fetchDispensingQueue, dispensePrescription, receiveSocketPrescriptionAlert,
  receiveSocketPrescriptionDispensed, deleteMedicine, deleteInventory
} from './pharmacySlice.js';
import { getSocket } from '../../utils/socket.js';

export const PharmacyDashboard = () => {
  const dispatch = useDispatch();
  const { medicines, inventory, dispensingQueue, loading } = useSelector((state) => state.pharmacy);
  const { user } = useSelector((state) => state.auth);

  const isPharmacist = user?.role === 'Pharmacist';
  const isAdminOrPharmacist = ['Pharmacist', 'Hospital Admin', 'Super Admin'].includes(user?.role);

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
  const [errorMsg, setErrorMsg] = useState('');

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
    })).then((res) => {
      if (!res.error) {
        setOpenRegister(false);
        setMedName('');
        setMedGeneric('');
        setMedStrength('');
        setMedManufacturer('');
        setErrorMsg('');
        dispatch(fetchMedicines());
      } else {
        setErrorMsg(res.payload || 'Failed to register medicine');
      }
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
    })).then((res) => {
      if (!res.error) {
        setOpenAddStock(false);
        setSelectedMed('');
        setStockQty('');
        setBatchNumber('');
        setSupplier('');
        setUnitPrice('');
        setExpiryDate('');
        setErrorMsg('');
        dispatch(fetchInventory());
      } else {
        setErrorMsg(res.payload || 'Failed to add stock batch');
      }
    });
  };

  const handleOpenDispense = (prescription) => {
    setSelectedPrescription(prescription);
    setErrorMsg('');
    // Auto-match prescriptions to inventory where possible
    const items = prescription.prescriptions.map(p => {
      // Find matching medicine ID in medicines master list
      const matched = medicines.find(m => m.name.toLowerCase().includes(p.drugName.toLowerCase()));
      // Find available batches in inventory for this medicine
      const matchedInventory = matched ? inventory.filter(inv => inv.medicineId?._id === matched._id) : [];
      const defaultBatch = matchedInventory[0]?.batchNumber || '';
      return {
        drugName: p.drugName,
        medicineId: matched ? matched._id : '',
        quantity: 10, // Default dispatch quantity
        batchNumber: defaultBatch
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
        setErrorMsg('');
        dispatch(fetchDispensingQueue());
        dispatch(fetchInventory());
      } else {
        setErrorMsg(res.payload || 'Failed to dispense prescription');
      }
    });
  };

  const handleDeleteMedicine = (id) => {
    if (window.confirm('Are you sure you want to delete this medicine from the catalog? This will also cascade delete all its associated stock batches.')) {
      dispatch(deleteMedicine(id)).then((res) => {
        if (!res.error) {
          dispatch(fetchMedicines());
          dispatch(fetchInventory());
        }
      });
    }
  };

  const handleDeleteInventory = (id) => {
    if (window.confirm('Are you sure you want to delete this stock batch from the inventory?')) {
      dispatch(deleteInventory(id)).then((res) => {
        if (!res.error) {
          dispatch(fetchInventory());
        }
      });
    }
  };

  const getLedgerItems = () => {
    const items = [];
    
    // 1. Add all active inventory batches
    inventory.forEach(inv => {
      items.push({
        _id: inv._id,
        isBatch: true,
        medicineName: inv.medicineId?.name,
        genericName: inv.medicineId?.genericName,
        batchNumber: inv.batchNumber,
        stock: inv.stock,
        expiryDate: inv.expiryDate,
        unitPrice: inv.unitPrice,
        reorderLevel: inv.reorderLevel,
        medicineId: inv.medicineId?._id
      });
    });

    // 2. Find medicines that do not have any inventory batches
    medicines.forEach(med => {
      const hasBatch = inventory.some(inv => inv.medicineId?._id === med._id);
      if (!hasBatch) {
        items.push({
          _id: med._id,
          isBatch: false,
          medicineName: med.name,
          genericName: med.genericName,
          batchNumber: 'No Batches Created',
          stock: 0,
          expiryDate: null,
          unitPrice: 0,
          reorderLevel: 0,
          medicineId: med._id
        });
      }
    });

    return items;
  };

  return (
    <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#ffffff', fontFamily: 'Outfit' }}>
          Pharmacy Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isAdminOrPharmacist && (
            <Button variant="outlined" startIcon={<Add />} onClick={() => { setErrorMsg(''); setOpenRegister(true); }}>
              Register Medicine
            </Button>
          )}
          {isPharmacist && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setErrorMsg(''); setOpenAddStock(true); }} sx={{ background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)' }}>
              Add Stock Batch
            </Button>
          )}
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
                        {isPharmacist ? (
                          <Button variant="contained" size="small" sx={{ backgroundColor: '#10b981' }} onClick={() => handleOpenDispense(presc)}>
                            Verify & Dispense
                          </Button>
                        ) : (
                          <Chip label="Pharmacist Only" size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'rgba(255,255,255,0.12)' }} />
                        )}
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
                    <TableCell sx={{ color: '#ffffff', fontWeight: 600 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getLedgerItems().map((item) => {
                    const isLowStock = item.isBatch && item.stock <= (item.reorderLevel || 10);
                    const isNearExpiry = item.isBatch && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const isOutOfStock = !item.isBatch;

                    return (
                      <TableRow key={item._id}>
                        <TableCell sx={{ fontWeight: 600 }}>{item.medicineName}</TableCell>
                        <TableCell>{item.genericName}</TableCell>
                        <TableCell sx={{ color: isOutOfStock ? 'text.secondary' : 'inherit', fontStyle: isOutOfStock ? 'italic' : 'normal' }}>
                          {item.batchNumber}
                        </TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          {item.isBatch ? `₹${item.unitPrice}` : '—'}
                        </TableCell>
                        <TableCell>
                          {isOutOfStock && <Chip icon={<Warning />} label="No Stock" color="error" size="small" />}
                          {isLowStock && <Chip icon={<Warning />} label="Low Stock" color="warning" size="small" sx={{ mr: 0.5 }} />}
                          {isNearExpiry && <Chip icon={<Warning />} label="Expiring Soon" color="error" size="small" />}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {item.isBatch && isAdminOrPharmacist && (
                              <Button variant="outlined" color="warning" size="small" onClick={() => handleDeleteInventory(item._id)}>
                                Delete Batch
                              </Button>
                            )}
                            {isAdminOrPharmacist && (
                              <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteMedicine(item.medicineId)}>
                                Delete Medicine
                              </Button>
                            )}
                            {!isAdminOrPharmacist && '—'}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {getLedgerItems().length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
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
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
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
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
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
            <TextField label="Unit Price (₹)" type="number" fullWidth value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
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
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
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
                      {inventory
                        .filter(inv => inv.medicineId?._id === item.medicineId)
                        .map(inv => (
                          <MenuItem key={inv._id} value={inv.batchNumber}>
                            {inv.batchNumber} (Stock: {inv.stock})
                          </MenuItem>
                        ))}
                      {inventory.filter(inv => inv.medicineId?._id === item.medicineId).length === 0 && (
                        <MenuItem value="">No active batches</MenuItem>
                      )}
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
