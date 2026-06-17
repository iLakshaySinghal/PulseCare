import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';

export const fetchLabRequests = createAsyncThunk(
  'lab/fetchRequests',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/lab/requests', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch lab requests');
    }
  }
);

export const createLabRequest = createAsyncThunk(
  'lab/createRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/lab/requests', requestData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to order lab test');
    }
  }
);

export const updateLabRequestStatus = createAsyncThunk(
  'lab/updateStatus',
  async ({ id, status, sampleDetails }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/lab/requests/${id}/status`, { status, sampleDetails });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update lab status');
    }
  }
);

export const uploadLabReport = createAsyncThunk(
  'lab/uploadReport',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/lab/requests/${id}/report`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to upload report');
    }
  }
);

export const reviewLabReport = createAsyncThunk(
  'lab/reviewReport',
  async ({ id, reviewNotes }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/lab/reports/${id}/review`, { reviewNotes });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to submit review');
    }
  }
);

const initialState = {
  requests: [],
  selectedReport: null,
  loading: false,
  error: null,
  success: false
};

const labSlice = createSlice({
  name: 'lab',
  initialState,
  reducers: {
    clearLabState: (state) => {
      state.error = null;
      state.success = false;
    },
    receiveSocketLabUpdate: (state, action) => {
      const { request, action: socketAction } = action.payload;
      if (socketAction === 'ORDER') {
        state.requests = [request, ...state.requests];
      } else {
        state.requests = state.requests.map((r) =>
          r._id === request._id ? { ...r, ...request } : r
        );
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchLabRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLabRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchLabRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Order
      .addCase(createLabRequest.fulfilled, (state, action) => {
        state.requests = [action.payload, ...state.requests];
        state.success = true;
      })
      // Upload Report
      .addCase(uploadLabReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadLabReport.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(uploadLabReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearLabState, receiveSocketLabUpdate } = labSlice.actions;
export default labSlice.reducer;
