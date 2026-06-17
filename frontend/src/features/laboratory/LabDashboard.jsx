import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Paper, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, IconButton
} from '@mui/material';
import {
  Science, GetApp, CloudUpload, RateReview, DoneAll, HourglassTop
} from '@mui/icons-material';
import { fetchLabRequests, updateLabRequestStatus, uploadLabReport, reviewLabReport, receiveSocketLabUpdate } from './labSlice.js';
import { getSocket } from '../../utils/socket.js';
import axiosInstance from '../../utils/axiosInstance.js';

export const LabDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { requests, loading } = useSelector((state) => state.laboratory);

  const [tabValue, setTabValue] = useState(0);
  const [openUpload, setOpenUpload] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  
  // Upload inputs
  const [resultsText, setResultsText] = useState('');
  const [fileUrl, setFileUrl] = useState(''); // text fallback for demo
  const [selectedFile, setSelectedFile] = useState(null);

  // Review inputs
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    dispatch(fetchLabRequests());

    const socket = getSocket();
    if (socket) {
      socket.on('lab_request_updated', (data) => {
        dispatch(receiveSocketLabUpdate(data));
      });
      return () => {
        socket.off('lab_request_updated');
      };
    }
  }, [dispatch]);

  const handleStatusUpdate = (id, newStatus, sampleType = null) => {
    const sampleDetails = sampleType ? { sampleType } : null;
    dispatch(updateLabRequestStatus({ id, status: newStatus, sampleDetails })).then(() => {
      dispatch(fetchLabRequests());
    });
  };

  const handleUploadSubmit = () => {
    if (!selectedReq) return;
    
    // In real app, upload via FormData. Here we allow mock File or mock URL
    const formData = new FormData();
    formData.append('results', resultsText);
    if (selectedFile) {
      formData.append('file', selectedFile);
    } else {
      // Mock payload falls back to URL if no file is chosen
      formData.append('fileUrl', fileUrl || '/uploads/mock_blood_report.pdf');
      formData.append('fileName', 'blood_report.pdf');
      formData.append('fileType', 'application/pdf');
    }

    dispatch(uploadLabReport({ id: selectedReq._id, formData })).then(() => {
      setOpenUpload(false);
      setResultsText('');
      setSelectedFile(null);
      setFileUrl('');
      dispatch(fetchLabRequests());
    });
  };

  const handleReviewSubmit = () => {
    if (!selectedReq) return;
    
    // Find associated report ID from backend
    axiosInstance.get(`/lab/reports/${selectedReq._id}`).then((res) => {
      const reportId = res.data.data._id;
      dispatch(reviewLabReport({ id: reportId, reviewNotes })).then(() => {
        setOpenReview(false);
        setReviewNotes('');
        dispatch(fetchLabRequests());
      });
    }).catch(() => {
      // Fallback fallback report review if lookup fails
      setOpenReview(false);
    });
  };

  // Filter requests based on tab selection
  const pendingRequests = requests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled');
  const completedRequests = requests.filter(r => r.status === 'Completed');

  return (
    <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Typography variant="h4" sx={{ mb: 1, color: '#ffffff', fontFamily: 'Outfit' }}>
        Laboratory Command Center
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Process diagnostic requests, track sample collections, and upload scans.
      </Typography>

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
          <Tab label="Pending Test Orders" icon={<HourglassTop />} iconPosition="start" />
          <Tab label="Completed Scans & Reports" icon={<Science />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
                <TableRow>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Patient</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Test Type</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Order Date</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Instructions</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(tabValue === 0 ? pendingRequests : completedRequests).map((req) => (
                  <TableRow key={req._id}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {req.patientId ? `${req.patientId.firstName} ${req.patientId.lastName}` : 'Unregistered'}
                    </TableCell>
                    <TableCell>{req.testType}</TableCell>
                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{req.instructions || 'Routine procedure'}</TableCell>
                    <TableCell>
                      <Chip
                        label={req.status}
                        size="small"
                        sx={{
                          backgroundColor:
                            req.status === 'Ordered' ? 'rgba(234, 179, 8, 0.15)' :
                            req.status === 'Sample Collected' ? 'rgba(59, 130, 246, 0.15)' :
                            req.status === 'Testing' ? 'rgba(168, 85, 247, 0.15)' :
                            req.status === 'Completed' ? 'rgba(34, 197, 94, 0.15)' :
                            'rgba(148, 163, 184, 0.15)',
                          color:
                            req.status === 'Ordered' ? '#facc15' :
                            req.status === 'Sample Collected' ? '#60a5fa' :
                            req.status === 'Testing' ? '#c084fc' :
                            req.status === 'Completed' ? '#4ade80' :
                            '#94a3b8',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {/* Lab Tech Actions */}
                      {user.role === 'Lab Technician' && (
                        <>
                          {req.status === 'Ordered' && (
                            <Button size="small" onClick={() => handleStatusUpdate(req._id, 'Sample Collected', 'Blood/Serum')}>
                              Collect Sample
                            </Button>
                          )}
                          {req.status === 'Sample Collected' && (
                            <Button size="small" color="secondary" onClick={() => handleStatusUpdate(req._id, 'Testing')}>
                              Start Testing
                            </Button>
                          )}
                          {req.status === 'Testing' && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CloudUpload />}
                              onClick={() => { setSelectedReq(req); setOpenUpload(true); }}
                              sx={{ backgroundColor: '#818cf8' }}
                            >
                              Upload Report
                            </Button>
                          )}
                        </>
                      )}
                      
                      {/* Doctor Action: Review Report */}
                      {user.role === 'Doctor' && req.status === 'Completed' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<RateReview />}
                          onClick={() => { setSelectedReq(req); setOpenReview(true); }}
                          sx={{ backgroundColor: '#10b981' }}
                        >
                          Review Scan
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(tabValue === 0 ? pendingRequests : completedRequests).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">No lab requests found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Diagnostic Report</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Upload laboratory scan sheets or blood work records. Files will be securely processed and linked to the patient's EMR automatically.
            </Typography>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <TextField
              label="Fallback Report File URL (For testing)"
              placeholder="e.g. /uploads/blood_chemistry_report.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              disabled={!!selectedFile}
            />
            <TextField
              label="Laboratory Results Synopsis"
              multiline
              rows={4}
              placeholder="Record analytical values or abnormal metrics summary..."
              value={resultsText}
              onChange={(e) => setResultsText(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)}>Cancel</Button>
          <Button onClick={handleUploadSubmit} variant="contained" color="primary">Complete Upload</Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={openReview} onClose={() => setOpenReview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Laboratory Results</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Review report files and log physician findings. A notification will alert the patient portal that results have been reviewed.
            </Typography>
            <TextField
              label="Physician Findings / Advice"
              multiline
              rows={4}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReview(false)}>Cancel</Button>
          <Button onClick={handleReviewSubmit} variant="contained" color="success">Log Review</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabDashboard;
