import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';

export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAll',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/appointments', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch appointments');
    }
  }
);

export const bookAppointment = createAsyncThunk(
  'appointments/book',
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/appointments', appointmentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to book appointment');
    }
  }
);

export const updateAppointmentStatus = createAsyncThunk(
  'appointments/updateStatus',
  async ({ id, status, cancellationReason }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/appointments/${id}/status`, { status, cancellationReason });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update appointment status');
    }
  }
);

export const fetchDoctorAvailability = createAsyncThunk(
  'appointments/fetchAvailability',
  async (doctorId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/appointments/availability/${doctorId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch doctor availability');
    }
  }
);

export const saveDoctorAvailability = createAsyncThunk(
  'appointments/saveAvailability',
  async (availabilityData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/appointments/availability', availabilityData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to configure availability');
    }
  }
);

const initialState = {
  appointments: [],
  pagination: null,
  doctorAvailability: [],
  loading: false,
  error: null,
  success: false
};

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearAppointmentState: (state) => {
      state.error = null;
      state.success = false;
    },
    receiveSocketAppointmentUpdate: (state, action) => {
      const { appointment, action: socketAction } = action.payload;
      if (socketAction === 'CREATE') {
        state.appointments = [appointment, ...state.appointments];
      } else {
        state.appointments = state.appointments.map((a) =>
          a._id === appointment._id ? { ...a, ...appointment } : a
        );
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload.appointments;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Book
      .addCase(bookAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = [action.payload, ...state.appointments];
        state.success = true;
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Status
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        state.appointments = state.appointments.map((a) =>
          a._id === action.payload._id ? { ...a, ...action.payload } : a
        );
      })
      // Availability
      .addCase(fetchDoctorAvailability.fulfilled, (state, action) => {
        state.doctorAvailability = action.payload;
      })
      .addCase(saveDoctorAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveDoctorAvailability.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(saveDoctorAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearAppointmentState, receiveSocketAppointmentUpdate } = appointmentSlice.actions;
export default appointmentSlice.reducer;
