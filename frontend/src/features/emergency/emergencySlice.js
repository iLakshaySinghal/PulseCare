import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';

export const fetchEmergencyCases = createAsyncThunk(
  'emergency/fetchCases',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/emergency/cases', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch emergency cases');
    }
  }
);

export const registerEmergencyCase = createAsyncThunk(
  'emergency/register',
  async (caseData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/emergency/register', caseData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to register emergency case');
    }
  }
);

export const assignEmergencyStaff = createAsyncThunk(
  'emergency/assignStaff',
  async ({ id, assignedDoctorId, assignedNurseId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/emergency/cases/${id}/assign`, {
        assignedDoctorId,
        assignedNurseId
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to assign staff');
    }
  }
);

export const updateEmergencyTreatment = createAsyncThunk(
  'emergency/updateTreatment',
  async ({ id, status, treatmentNotes }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/emergency/cases/${id}/treatment`, {
        status,
        treatmentNotes
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update treatment');
    }
  }
);

const initialState = {
  cases: [],
  loading: false,
  error: null,
  success: false
};

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    clearEmergencyState: (state) => {
      state.error = null;
      state.success = false;
    },
    receiveSocketEmergencyUpdate: (state, action) => {
      const { emergencyCase, action: socketAction } = action.payload;
      if (socketAction === 'REGISTER') {
        state.cases = [...state.cases, emergencyCase].sort((a, b) => {
          // Sort Critical -> High -> Medium -> Low
          const pMap = { Critical: 1, High: 2, Medium: 3, Low: 4 };
          return pMap[a.priority] - pMap[b.priority];
        });
      } else {
        state.cases = state.cases
          .map((c) => (c._id === emergencyCase._id ? { ...c, ...emergencyCase } : c))
          .filter((c) => c.status !== 'Discharged' && c.status !== 'Admitted');
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchEmergencyCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmergencyCases.fulfilled, (state, action) => {
        state.loading = false;
        state.cases = action.payload;
      })
      .addCase(fetchEmergencyCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerEmergencyCase.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerEmergencyCase.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.cases = [...state.cases, action.payload].sort((a, b) => {
          const pMap = { Critical: 1, High: 2, Medium: 3, Low: 4 };
          return pMap[a.priority] - pMap[b.priority];
        });
      })
      .addCase(registerEmergencyCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearEmergencyState, receiveSocketEmergencyUpdate } = emergencySlice.actions;
export default emergencySlice.reducer;
