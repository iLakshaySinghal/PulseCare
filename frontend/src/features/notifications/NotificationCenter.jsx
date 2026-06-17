import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, Chip, CircularProgress, Alert } from '@mui/material';
import { NotificationsActive, Mail, Done, Error as ErrorIcon } from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance.js';

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axiosInstance.get(`/notifications?page=${page}&limit=10`);
      setNotifications(response.data.data.notifications);
      setTotalPages(response.data.data.pagination.pages);
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load notifications history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  return (
    <Box p={3}>
      <Box mb={4} display="flex" alignItems="center" gap={1.5}>
        <NotificationsActive color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            Notification Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View transactional notification alerts sent to your profile address
          </Typography>
        </Box>
      </Box>

      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Body Preview</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Attempts</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date Sent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifications.map((n) => (
                    <TableRow key={n._id}>
                      <TableCell>
                        <Chip
                          icon={<Mail />}
                          label={n.type}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{n.subject}</TableCell>
                      <TableCell sx={{ maxW: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {/* Strip HTML tag details for simple preview */}
                        {n.body.replace(/<[^>]*>/g, '').slice(0, 80)}...
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={n.status === 'Sent' ? <Done /> : <ErrorIcon />}
                          label={n.status}
                          size="small"
                          color={n.status === 'Sent' ? 'success' : n.status === 'Pending' ? 'warning' : 'error'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>{n.retryCount} / 3</TableCell>
                      <TableCell>{new Date(n.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {notifications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        Your notification log feed is currently empty.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationCenter;
