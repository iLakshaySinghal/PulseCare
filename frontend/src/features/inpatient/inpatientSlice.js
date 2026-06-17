import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';

export const fetchWards = createAsyncThunk(
  'inpatient/fetchWards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/admissions/wards');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch wards');
    }
  }
);

export const fetchRooms = createAsyncThunk(
  'inpatient/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/admissions/rooms');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch rooms');
    }
  }
);

export const fetchBeds = createAsyncThunk(
  'inpatient/fetchBeds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/admissions/beds');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch beds');
    }
  }
);

export const fetchAdmissions = createAsyncThunk(
  'inpatient/fetchAdmissions',
  async ({ page = 1, limit = 10, status = '', search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/admissions?page=${page}&limit=${limit}&status=${status}&search=${search}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch admissions');
    }
  }
);

export const fetchAdmissionById = createAsyncThunk(
  'inpatient/fetchAdmissionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/admissions/${id}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch admission details');
    }
  }
);

export const admitPatient = createAsyncThunk(
  'inpatient/admitPatient',
  async (admissionData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/admissions', admissionData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to admit patient');
    }
  }
);

export const addVitals = createAsyncThunk(
  'inpatient/addVitals',
  async ({ id, bloodPressure, heartRate, temperature }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/admissions/${id}/vitals`, { bloodPressure, heartRate, temperature });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to append vitals');
    }
  }
);

export const addTreatment = createAsyncThunk(
  'inpatient/addTreatment',
  async ({ id, treatmentNote }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/admissions/${id}/treatment`, { treatmentNote });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to append treatment note');
    }
  }
);

export const dischargePatient = createAsyncThunk(
  'inpatient/dischargePatient',
  async ({ id, conditionAtDischarge, treatmentSummary, followUpInstructions }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/admissions/${id}/discharge`, { conditionAtDischarge, treatmentSummary, followUpInstructions });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to discharge patient');
    }
  }
);

const initialState = {
  wards: [],
  rooms: [],
  beds: [],
  admissions: [],
  currentAdmission: null,
  pagination: { total: 0, page: 1, limit: 10, pages: 1 },
  loading: false,
  error: null,
  admitSuccess: false,
  dischargeSuccess: false
};

const inpatientSlice = createSlice({
  name: 'inpatient',
  initialState,
  reducers: {
    clearInpatientError: (state) => {
      state.error = null;
    },
    resetInpatientSuccess: (state) => {
      state.admitSuccess = false;
      state.dischargeSuccess = false;
    },
    updateBedState: (state, action) => {
      const { bedId, isOccupied } = action.payload;
      const bed = state.beds.find(b => b._id === bedId);
      if (bed) {
        bed.isOccupied = isOccupied;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wards
      .addCase(fetchWards.fulfilled, (state, action) => {
        state.wards = action.payload;
      })
      // Fetch Rooms
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.rooms = action.payload;
      })
      // Fetch Beds
      .addCase(fetchBeds.fulfilled, (state, action) => {
        state.beds = action.payload;
      })
      // Fetch Admissions
      .addCase(fetchAdmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.admissions = action.payload.admissions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAdmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Admission By Id
      .addCase(fetchAdmissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAdmission = action.payload;
      })
      .addCase(fetchAdmissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Admit Patient
      .addCase(admitPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.admitSuccess = false;
      })
      .addCase(admitPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.admissions.unshift(action.payload);
        state.admitSuccess = true;
      })
      .addCase(admitPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.admitSuccess = false;
      })
      // Discharge Patient
      .addCase(dischargePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.dischargeSuccess = false;
      })
      .addCase(dischargePatient.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAdmission = action.payload;
        state.dischargeSuccess = true;
        const index = state.admissions.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.admissions[index] = action.payload;
        }
      })
      .addCase(dischargePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.dischargeSuccess = false;
      })
      // Add Vitals / Treatment
      .addCase(addVitals.fulfilled, (state, action) => {
        state.currentAdmission = action.payload;
      })
      .addCase(addTreatment.fulfilled, (state, action) => {
        state.currentAdmission = action.payload;
      });
  }
});

export const { clearInpatientError, resetInpatientSuccess, updateBedState } = inpatientSlice.actions;
export default inpatientSlice.reducer;
