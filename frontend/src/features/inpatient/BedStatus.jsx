import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Paper, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip } from '@mui/material';
import { BedroomChild, Add, SingleBed } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance.js';
import { getSocket } from '../../utils/socket.js';

export const BedStatus = () => {
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add Bed Modal State
  const [openAddBed, setOpenAddBed] = useState(false);
  const [newBedNumber, setNewBedNumber] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const roomRes = await axiosInstance.get('/admissions/rooms');
      setRooms(roomRes.data.data || []);
      const bedRes = await axiosInstance.get('/admissions/beds');
      setBeds(bedRes.data.data || []);
    } catch (err) {
      setError('Failed to fetch rooms and beds layout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Socket.IO listener for real-time occupancy updates
    const socket = getSocket();
    if (socket) {
      socket.on('bed_status_updated', (data) => {
        console.log('Real-time Bed Status Update Received:', data);
        setBeds(prevBeds => 
          prevBeds.map(b => b._id === data.bedId ? { ...b, isOccupied: data.isOccupied } : b)
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('bed_status_updated');
      }
    };
  }, []);

  const handleAddBedSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/admissions/beds', {
        bedNumber: newBedNumber,
        roomId: selectedRoomId
      });
      if (res.data.success) {
        setOpenAddBed(false);
        setNewBedNumber('');
        loadData();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add bed');
    }
  };

  return (
    <Box p={3}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <BedroomChild color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
              Bed Availability Grid
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time visualization of clinical bed occupancy indices across rooms and wards
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setOpenAddBed(true)}
        >
          Add Physical Bed
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={4}>
          {rooms.map((room) => {
            const roomBeds = beds.filter(b => b.roomId?._id === room._id);
            return (
              <Grid item xs={12} sm={6} md={4} key={room._id}>
                <Card sx={{ height: '100%', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                        Room {room.roomNumber}
                      </Typography>
                      <Chip label={room.roomType} size="small" color="primary" variant="outlined" />
                    </Box>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                      Ward Location: {room.wardId?.name}
                    </Typography>

                    <Grid container spacing={2}>
                      {roomBeds.map((bed) => (
                        <Grid item xs={4} key={bed._id}>
                          <Paper
                            sx={{
                              p: 1.5,
                              textAlign: 'center',
                              backgroundColor: bed.isOccupied ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              border: `1px solid ${bed.isOccupied ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                              color: bed.isOccupied ? 'error.light' : 'success.light',
                              borderRadius: 2
                            }}
                          >
                            <SingleBed sx={{ fontSize: 24, mb: 0.5 }} />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Bed {bed.bedNumber}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                              {bed.isOccupied ? 'Occupied' : 'Vacant'}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                      {roomBeds.length === 0 && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            No physical beds assigned to this room yet.
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add Bed Modal */}
      <Dialog open={openAddBed} onClose={() => setOpenAddBed(false)}>
        <DialogTitle sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>Add Bed Asset</DialogTitle>
        <form onSubmit={handleAddBedSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Bed Identifier / Number"
              fullWidth
              required
              value={newBedNumber}
              onChange={(e) => setNewBedNumber(e.target.value)}
              placeholder="e.g. Bed-3"
            />
            <TextField
              select
              label="Room Reference"
              fullWidth
              required
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
            >
              {rooms.map(r => (
                <MenuItem key={r._id} value={r._id}>Room {r.roomNumber} ({r.roomType})</MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenAddBed(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Confirm Bed Asset</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default BedStatus;
