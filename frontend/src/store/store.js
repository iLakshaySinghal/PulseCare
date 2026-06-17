import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import appointmentsReducer from '../features/appointments/appointmentSlice.js';
import consultationsReducer from '../features/consultations/consultationSlice.js';
import laboratoryReducer from '../features/laboratory/labSlice.js';
import pharmacyReducer from '../features/pharmacy/pharmacySlice.js';
import emergencyReducer from '../features/emergency/emergencySlice.js';
import aiReducer from '../features/ai/aiSlice.js';
import billingReducer from '../features/billing/billingSlice.js';
import inpatientReducer from '../features/inpatient/inpatientSlice.js';
import analyticsReducer from '../features/analytics/analyticsSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentsReducer,
    consultations: consultationsReducer,
    laboratory: laboratoryReducer,
    pharmacy: pharmacyReducer,
    emergency: emergencyReducer,
    ai: aiReducer,
    billing: billingReducer,
    inpatient: inpatientReducer,
    analytics: analyticsReducer
  }
});

export default store;
