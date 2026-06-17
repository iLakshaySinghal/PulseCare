import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';

export const startConsultation = createAsyncThunk(
  'consultations/start',
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/consultations', { appointmentId });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to start consultation');
    }
  }
);

export const updateConsultationDraft = createAsyncThunk(
  'consultations/updateDraft',
  async ({ id, ...draftData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/consultations/${id}`, draftData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update consultation draft');
    }
  }
);

export const completeConsultation = createAsyncThunk(
  'consultations/complete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/consultations/${id}/complete`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to finalize consultation');
    }
  }
);

export const fetchPatientConsultations = createAsyncThunk(
  'consultations/fetchPatientHistory',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/consultations/patient/${patientId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch patient history');
    }
  }
);

const initialState = {
  activeConsultation: null,
  patientHistory: [],
  loading: false,
  error: null,
  success: false
};

const consultationSlice = createSlice({
  name: 'consultations',
  initialState,
  reducers: {
    clearConsultationState: (state) => {
      state.error = null;
      state.success = false;
    },
    resetActiveConsultation: (state) => {
      state.activeConsultation = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Start
      .addCase(startConsultation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startConsultation.fulfilled, (state, action) => {
        state.loading = false;
        state.activeConsultation = action.payload;
      })
      .addCase(startConsultation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateConsultationDraft.fulfilled, (state, action) => {
        state.activeConsultation = action.payload;
      })
      // Complete
      .addCase(completeConsultation.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(completeConsultation.fulfilled, (state, action) => {
        state.loading = false;
        state.activeConsultation = null;
        state.success = true;
      })
      .addCase(completeConsultation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // History
      .addCase(fetchPatientConsultations.fulfilled, (state, action) => {
        state.patientHistory = action.payload;
      });
  }
});

export const { clearConsultationState, resetActiveConsultation } = consultationSlice.actions;
export default consultationSlice.reducer;
