import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';

export const analyzeSymptoms = createAsyncThunk(
  'ai/analyzeSymptoms',
  async (symptomData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/ai/symptom-analyze', symptomData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to analyze symptoms');
    }
  }
);

export const summarizePatientHistory = createAsyncThunk(
  'ai/summarizePatientHistory',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/ai/summarize-patient', { patientId });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to summarize patient history');
    }
  }
);

export const explainPrescription = createAsyncThunk(
  'ai/explainPrescription',
  async ({ medicineName, patientQuery }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/ai/explain-prescription', { medicineName, patientQuery });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to explain prescription');
    }
  }
);

export const assistAppointment = createAsyncThunk(
  'ai/assistAppointment',
  async (queryText, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/ai/appointment-assist', { queryText });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to search appointments');
    }
  }
);

export const getOperationsIntelligence = createAsyncThunk(
  'ai/getOperationsIntelligence',
  async (queryText, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/ai/operations-intelligence', { queryText });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to analyze operations');
    }
  }
);

const initialState = {
  symptomAnalyzer: { data: null, loading: false, error: null },
  patientSummary: { data: null, loading: false, error: null },
  prescriptionExplainer: { data: null, loading: false, error: null },
  appointmentAssistant: { data: null, loading: false, error: null },
  operationsIntelligence: { data: null, loading: false, error: null }
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearAIState: (state) => {
      state.symptomAnalyzer = { data: null, loading: false, error: null };
      state.patientSummary = { data: null, loading: false, error: null };
      state.prescriptionExplainer = { data: null, loading: false, error: null };
      state.appointmentAssistant = { data: null, loading: false, error: null };
      state.operationsIntelligence = { data: null, loading: false, error: null };
    }
  },
  extraReducers: (builder) => {
    builder
      // Symptoms
      .addCase(analyzeSymptoms.pending, (state) => {
        state.symptomAnalyzer.loading = true;
        state.symptomAnalyzer.error = null;
      })
      .addCase(analyzeSymptoms.fulfilled, (state, action) => {
        state.symptomAnalyzer.loading = false;
        state.symptomAnalyzer.data = action.payload;
      })
      .addCase(analyzeSymptoms.rejected, (state, action) => {
        state.symptomAnalyzer.loading = false;
        state.symptomAnalyzer.error = action.payload;
      })
      // Summarizer
      .addCase(summarizePatientHistory.pending, (state) => {
        state.patientSummary.loading = true;
        state.patientSummary.error = null;
      })
      .addCase(summarizePatientHistory.fulfilled, (state, action) => {
        state.patientSummary.loading = false;
        state.patientSummary.data = action.payload;
      })
      .addCase(summarizePatientHistory.rejected, (state, action) => {
        state.patientSummary.loading = false;
        state.patientSummary.error = action.payload;
      })
      // Prescription Explainer
      .addCase(explainPrescription.pending, (state) => {
        state.prescriptionExplainer.loading = true;
        state.prescriptionExplainer.error = null;
      })
      .addCase(explainPrescription.fulfilled, (state, action) => {
        state.prescriptionExplainer.loading = false;
        state.prescriptionExplainer.data = action.payload;
      })
      .addCase(explainPrescription.rejected, (state, action) => {
        state.prescriptionExplainer.loading = false;
        state.prescriptionExplainer.error = action.payload;
      })
      // Appointment
      .addCase(assistAppointment.pending, (state) => {
        state.appointmentAssistant.loading = true;
        state.appointmentAssistant.error = null;
      })
      .addCase(assistAppointment.fulfilled, (state, action) => {
        state.appointmentAssistant.loading = false;
        state.appointmentAssistant.data = action.payload;
      })
      .addCase(assistAppointment.rejected, (state, action) => {
        state.appointmentAssistant.loading = false;
        state.appointmentAssistant.error = action.payload;
      })
      // Ops Intelligence
      .addCase(getOperationsIntelligence.pending, (state) => {
        state.operationsIntelligence.loading = true;
        state.operationsIntelligence.error = null;
      })
      .addCase(getOperationsIntelligence.fulfilled, (state, action) => {
        state.operationsIntelligence.loading = false;
        state.operationsIntelligence.data = action.payload;
      })
      .addCase(getOperationsIntelligence.rejected, (state, action) => {
        state.operationsIntelligence.loading = false;
        state.operationsIntelligence.error = action.payload;
      });
  }
});

export const { clearAIState } = aiSlice.actions;
export default aiSlice.reducer;
