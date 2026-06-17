import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';

export const fetchExecutiveMetrics = createAsyncThunk(
  'analytics/fetchExecutiveMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/executive');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch executive stats');
    }
  }
);

export const fetchRevenueMetrics = createAsyncThunk(
  'analytics/fetchRevenueMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/revenue');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch revenue stats');
    }
  }
);

export const fetchOperationalMetrics = createAsyncThunk(
  'analytics/fetchOperationalMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/operational');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch operational stats');
    }
  }
);

export const fetchDepartmentalMetrics = createAsyncThunk(
  'analytics/fetchDepartmentalMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/departments');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch departmental stats');
    }
  }
);

const initialState = {
  executive: { data: null, loading: false, error: null },
  revenue: { data: null, loading: false, error: null },
  operational: { data: null, loading: false, error: null },
  departmental: { data: null, loading: false, error: null }
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsState: (state) => {
      state.executive = { data: null, loading: false, error: null };
      state.revenue = { data: null, loading: false, error: null };
      state.operational = { data: null, loading: false, error: null };
      state.departmental = { data: null, loading: false, error: null };
    }
  },
  extraReducers: (builder) => {
    builder
      // Executive
      .addCase(fetchExecutiveMetrics.pending, (state) => {
        state.executive.loading = true;
        state.executive.error = null;
      })
      .addCase(fetchExecutiveMetrics.fulfilled, (state, action) => {
        state.executive.loading = false;
        state.executive.data = action.payload;
      })
      .addCase(fetchExecutiveMetrics.rejected, (state, action) => {
        state.executive.loading = false;
        state.executive.error = action.payload;
      })
      // Revenue
      .addCase(fetchRevenueMetrics.pending, (state) => {
        state.revenue.loading = true;
        state.revenue.error = null;
      })
      .addCase(fetchRevenueMetrics.fulfilled, (state, action) => {
        state.revenue.loading = false;
        state.revenue.data = action.payload;
      })
      .addCase(fetchRevenueMetrics.rejected, (state, action) => {
        state.revenue.loading = false;
        state.revenue.error = action.payload;
      })
      // Operational
      .addCase(fetchOperationalMetrics.pending, (state) => {
        state.operational.loading = true;
        state.operational.error = null;
      })
      .addCase(fetchOperationalMetrics.fulfilled, (state, action) => {
        state.operational.loading = false;
        state.operational.data = action.payload;
      })
      .addCase(fetchOperationalMetrics.rejected, (state, action) => {
        state.operational.loading = false;
        state.operational.error = action.payload;
      })
      // Departmental
      .addCase(fetchDepartmentalMetrics.pending, (state) => {
        state.departmental.loading = true;
        state.departmental.error = null;
      })
      .addCase(fetchDepartmentalMetrics.fulfilled, (state, action) => {
        state.departmental.loading = false;
        state.departmental.data = action.payload;
      })
      .addCase(fetchDepartmentalMetrics.rejected, (state, action) => {
        state.departmental.loading = false;
        state.departmental.error = action.payload;
      });
  }
});

export const { clearAnalyticsState } = analyticsSlice.actions;
export default analyticsSlice.reducer;
