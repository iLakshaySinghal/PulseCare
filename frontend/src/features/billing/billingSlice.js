import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';

export const fetchInvoices = createAsyncThunk(
  'billing/fetchInvoices',
  async ({ page = 1, limit = 10, status = '', search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/billing/invoices?page=${page}&limit=${limit}&status=${status}&search=${search}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch invoices');
    }
  }
);

export const fetchInvoiceById = createAsyncThunk(
  'billing/fetchInvoiceById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/billing/invoices/${id}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch invoice details');
    }
  }
);

export const fetchUnbilledItems = createAsyncThunk(
  'billing/fetchUnbilledItems',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/billing/unbilled/${patientId}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to scan patient unbilled files');
    }
  }
);

export const generateInvoice = createAsyncThunk(
  'billing/generateInvoice',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/billing/invoices', invoiceData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to generate invoice');
    }
  }
);

export const submitPayment = createAsyncThunk(
  'billing/submitPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/billing/payments', paymentData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to process payment transaction');
    }
  }
);

export const submitClaim = createAsyncThunk(
  'billing/submitClaim',
  async (claimData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/billing/insurance/claim', claimData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to log insurance claim');
    }
  }
);

export const submitClaimApproval = createAsyncThunk(
  'billing/submitClaimApproval',
  async (approvalData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/billing/insurance/approve', approvalData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to process insurance approval');
    }
  }
);

const initialState = {
  invoices: [],
  currentInvoice: null,
  unbilledItems: [],
  pagination: { total: 0, page: 1, limit: 10, pages: 1 },
  loading: false,
  error: null,
  paymentSuccess: false
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    clearBillingError: (state) => {
      state.error = null;
    },
    resetPaymentSuccess: (state) => {
      state.paymentSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Invoices
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Invoice By Id
      .addCase(fetchInvoiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Unbilled Items
      .addCase(fetchUnbilledItems.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.unbilledItems = [];
      })
      .addCase(fetchUnbilledItems.fulfilled, (state, action) => {
        state.loading = false;
        state.unbilledItems = action.payload;
      })
      .addCase(fetchUnbilledItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Generate Invoice
      .addCase(generateInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices.unshift(action.payload);
      })
      .addCase(generateInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit Payment
      .addCase(submitPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.paymentSuccess = false;
      })
      .addCase(submitPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload.invoice;
        state.paymentSuccess = true;
      })
      .addCase(submitPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.paymentSuccess = false;
      })
      // Submit Insurance Claims
      .addCase(submitClaim.fulfilled, (state, action) => {
        state.currentInvoice = action.payload;
      })
      .addCase(submitClaimApproval.fulfilled, (state, action) => {
        state.currentInvoice = action.payload;
      });
  }
});

export const { clearBillingError, resetPaymentSuccess } = billingSlice.actions;
export default billingSlice.reducer;
