import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';

import { checkAuthSession } from './features/auth/authSlice.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';

import Login from './features/auth/Login.jsx';
import Register from './features/auth/Register.jsx';
import ForgotPassword from './features/auth/ForgotPassword.jsx';
import ResetPassword from './features/auth/ResetPassword.jsx';

import AdminDashboard from './features/dashboard/AdminDashboard.jsx';
import PatientManagement from './features/patients/PatientManagement.jsx';
import EMRManagement from './features/emr/EMRManagement.jsx';
import NotificationCenter from './features/notifications/NotificationCenter.jsx';

import AppointmentDashboard from './features/appointments/AppointmentDashboard.jsx';
import DoctorDashboard from './features/consultations/DoctorDashboard.jsx';
import ConsultationWorkspace from './features/consultations/ConsultationWorkspace.jsx';
import LabDashboard from './features/laboratory/LabDashboard.jsx';
import PharmacyDashboard from './features/pharmacy/PharmacyDashboard.jsx';
import EmergencyDashboard from './features/emergency/EmergencyDashboard.jsx';

// AI assistant pages
import SymptomAnalyzer from './features/ai/SymptomAnalyzer.jsx';
import PrescriptionExplainer from './features/ai/PrescriptionExplainer.jsx';
import AIAssistantChat from './features/ai/AIAssistantChat.jsx';
import OperationsIntelligence from './features/ai/OperationsIntelligence.jsx';

// Billing pages
import BillingDashboard from './features/billing/BillingDashboard.jsx';
import InvoiceGenerator from './features/billing/InvoiceGenerator.jsx';
import PaymentScreen from './features/billing/PaymentScreen.jsx';
import RevenueScreen from './features/billing/RevenueScreen.jsx';

// Inpatient pages
import AdmissionDashboard from './features/inpatient/AdmissionDashboard.jsx';
import RoomAllocation from './features/inpatient/RoomAllocation.jsx';
import BedStatus from './features/inpatient/BedStatus.jsx';

// Analytics pages
import AnalyticsDashboard from './features/analytics/AnalyticsDashboard.jsx';

// Landing Page Router: Dynamically directs authenticated roles to their home dashboard
const HomeRedirect = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'Super Admin':
    case 'Hospital Admin':
      return <AdminDashboard />;
    case 'Patient':
      return <EMRManagement />;
    case 'Doctor':
      return <DoctorDashboard />;
    case 'Nurse':
    case 'Receptionist':
      return <PatientManagement />;
    case 'Lab Technician':
      return <LabDashboard />;
    case 'Pharmacist':
      return <PharmacyDashboard />;
    default:
      return <NotificationCenter />;
  }
};

export const App = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthSession());
  }, [dispatch]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f172a'
        }}
      >
        <CircularProgress color="primary" size={50} />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 'calc(100vh - 64px)' }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              backgroundColor: 'transparent',
              p: 1,
              position: 'relative'
            }}
          >
            {/* Ambient Background Glow elements */}
            <div className="ambient-glow-1" />
            <div className="ambient-glow-2" />

            <Routes>
              {/* Public Authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Dynamic Homepage landing routing */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomeRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Patient registry (staff only) */}
              <Route
                path="/patients"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor', 'Nurse']}>
                    <PatientManagement />
                  </ProtectedRoute>
                }
              />

              {/* Medical Records timelines */}
              <Route
                path="/emr"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Pharmacist', 'Lab Technician', 'Patient']}>
                    <EMRManagement />
                  </ProtectedRoute>
                }
              />

              {/* Appointments booking */}
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor', 'Nurse', 'Patient']}>
                    <AppointmentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Doctor Consultations queues and workspaces */}
              <Route
                path="/consultation"
                element={
                  <ProtectedRoute allowedRoles={['Doctor']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultation/:id"
                element={
                  <ProtectedRoute allowedRoles={['Doctor']}>
                    <ConsultationWorkspace />
                  </ProtectedRoute>
                }
              />

              {/* Laboratory Scan workflows */}
              <Route
                path="/laboratory"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Lab Technician']}>
                    <LabDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Pharmacy inventory stocks and queues */}
              <Route
                path="/pharmacy"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Pharmacist', 'Doctor', 'Nurse']}>
                    <PharmacyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Emergency Department Command */}
              <Route
                path="/emergency"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist']}>
                    <EmergencyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* AI assistant pathways */}
              <Route
                path="/ai/chat"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient']}>
                    <AIAssistantChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai/symptoms"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient']}>
                    <SymptomAnalyzer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai/prescriptions"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Pharmacist', 'Patient']}>
                    <PrescriptionExplainer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai/operations"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin']}>
                    <OperationsIntelligence />
                  </ProtectedRoute>
                }
              />

              {/* Billing and Invoicing workflows */}
              <Route
                path="/billing"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Billing Executive', 'Patient']}>
                    <BillingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing/generate"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Billing Executive']}>
                    <InvoiceGenerator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing/pay/:id"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Billing Executive', 'Patient']}>
                    <PaymentScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing/revenue"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Billing Executive']}>
                    <RevenueScreen />
                  </ProtectedRoute>
                }
              />

              {/* Inpatient Admission management */}
              <Route
                path="/inpatient"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient']}>
                    <AdmissionDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inpatient/rooms"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Nurse', 'Receptionist']}>
                    <RoomAllocation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inpatient/beds"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist']}>
                    <BedStatus />
                  </ProtectedRoute>
                }
              />

              {/* Reports & Analytics */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Hospital Admin']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Common Notifications alerts logs */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                }
              />

              {/* Page not found redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </BrowserRouter>
  );
};

export default App;
