import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, MenuItem, Alert, CircularProgress, Chip } from '@mui/material';
import { MeetingRoom, Add, BedroomParent } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance.js';

export const RoomAllocation = () => {
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ward Form
  const [wardName, setWardName] = useState('');
  const [wardDept, setWardDept] = useState('');

  // Room Form
  const [roomNum, setRoomNum] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [roomType, setRoomType] = useState('General');
  const [charges, setCharges] = useState(200);

  const fetchRoomsAndWards = async () => {
    setLoading(true);
    try {
      const wRes = await axiosInstance.get('/admissions/wards');
      setWards(wRes.data.data || []);
      const rRes = await axiosInstance.get('/admissions/rooms');
      setRooms(rRes.data.data || []);
    } catch (err) {
      setError('Failed to fetch rooms metadata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsAndWards();
  }, []);

  const handleAddWard = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/admissions/wards', { name: wardName, department: wardDept });
      setWardName('');
      setWardDept('');
      fetchRoomsAndWards();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create ward');
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/admissions/rooms', {
        roomNumber: roomNum,
        wardId: selectedWardId,
        roomType,
        chargesPerDay: charges
      });
      setRoomNum('');
      setCharges(200);
      fetchRoomsAndWards();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create room');
    }
  };

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <MeetingRoom color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            Room & Ward Controls
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure clinic wards, add inpatient rooms, and set pricing matrix indices
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Ward Form */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Add color="primary" /> Create New Ward
              </Typography>
              <form onSubmit={handleAddWard}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField label="Ward Name" fullWidth required value={wardName} onChange={(e) => setWardName(e.target.value)} />
                  <TextField label="Department" fullWidth required value={wardDept} onChange={(e) => setWardDept(e.target.value)} />
                  <Button type="submit" variant="contained" color="primary">Add Ward Unit</Button>
                </Box>
              </form>
            </CardContent>
          </Card>

          {/* Room Form */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Outfit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Add color="secondary" /> Create New Room
              </Typography>
              <form onSubmit={handleAddRoom}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField label="Room Number" fullWidth required value={roomNum} onChange={(e) => setRoomNum(e.target.value)} />
                  <TextField
                    select
                    label="Ward Unit"
                    fullWidth
                    required
                    value={selectedWardId}
                    onChange={(e) => setSelectedWardId(e.target.value)}
                  >
                    {wards.map(w => (
                      <MenuItem key={w._id} value={w._id}>{w.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Room Type"
                    fullWidth
                    required
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                  >
                    <MenuItem value="General">General Ward</MenuItem>
                    <MenuItem value="Semi-Private">Semi-Private</MenuItem>
                    <MenuItem value="Private">Private Suite</MenuItem>
                    <MenuItem value="ICU">ICU Critical</MenuItem>
                  </TextField>
                  <TextField label="Charges Per Day ($)" type="number" fullWidth required value={charges} onChange={(e) => setCharges(e.target.value)} />
                  <Button type="submit" variant="contained" color="secondary">Add Room Number</Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Rooms List Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box p={2} display="flex" alignItems="center" gap={1}>
                <BedroomParent color="primary" />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 600 }}>
                  Active Ward & Rooms Inventory
                </Typography>
              </Box>
              {loading ? (
                <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
              ) : (
                <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Room No</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Ward Location</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Charges / Day</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>State</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rooms.map((room) => (
                        <TableRow key={room._id}>
                          <TableCell sx={{ fontWeight: 600 }}>Room {room.roomNumber}</TableCell>
                          <TableCell>{room.wardId?.name} ({room.wardId?.department})</TableCell>
                          <TableCell><Chip label={room.roomType} size="small" variant="outlined" /></TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>${room.chargesPerDay}</TableCell>
                          <TableCell>
                            <Chip label={room.isActive ? 'Active' : 'Inactive'} size="small" color={room.isActive ? 'success' : 'default'} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RoomAllocation;
