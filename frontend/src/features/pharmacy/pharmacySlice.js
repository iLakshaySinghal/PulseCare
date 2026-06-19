import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';

export const fetchMedicines = createAsyncThunk(
  'pharmacy/fetchMedicines',
  async (search, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/pharmacy/medicines', { params: { search } });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch medicines');
    }
  }
);

export const registerMedicine = createAsyncThunk(
  'pharmacy/registerMedicine',
  async (medicineData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/pharmacy/medicines', medicineData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to register medicine');
    }
  }
);

export const fetchInventory = createAsyncThunk(
  'pharmacy/fetchInventory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/pharmacy/inventory');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch inventory');
    }
  }
);

export const deleteMedicine = createAsyncThunk(
  'pharmacy/deleteMedicine',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/pharmacy/medicines/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to delete medicine');
    }
  }
);

export const deleteInventory = createAsyncThunk(
  'pharmacy/deleteInventory',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/pharmacy/inventory/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to delete stock batch');
    }
  }
);

export const addStock = createAsyncThunk(
  'pharmacy/addStock',
  async (stockData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/pharmacy/inventory', stockData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to add stock');
    }
  }
);

export const fetchDispensingQueue = createAsyncThunk(
  'pharmacy/fetchDispensingQueue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/pharmacy/dispense-queue');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch dispensing queue');
    }
  }
);

export const dispensePrescription = createAsyncThunk(
  'pharmacy/dispense',
  async (dispenseData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/pharmacy/dispense', dispenseData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to dispense prescription');
    }
  }
);

const initialState = {
  medicines: [],
  inventory: [],
  dispensingQueue: [],
  loading: false,
  error: null,
  success: false
};

const pharmacySlice = createSlice({
  name: 'pharmacy',
  initialState,
  reducers: {
    clearPharmacyState: (state) => {
      state.error = null;
      state.success = false;
    },
    receiveSocketPrescriptionAlert: (state, action) => {
      // Action payloads could be used to push to the queue in real-time
      const newPrescription = action.payload;
      state.dispensingQueue = [newPrescription, ...state.dispensingQueue];
    },
    receiveSocketPrescriptionDispensed: (state, action) => {
      const { emrId } = action.payload;
      state.dispensingQueue = state.dispensingQueue.filter((p) => p._id !== emrId);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Medicines
      .addCase(fetchMedicines.fulfilled, (state, action) => {
        state.medicines = action.payload;
      })
      // Fetch Inventory
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.inventory = action.payload;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Queue
      .addCase(fetchDispensingQueue.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDispensingQueue.fulfilled, (state, action) => {
        state.loading = false;
        state.dispensingQueue = action.payload;
      })
      .addCase(fetchDispensingQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Dispense
      .addCase(dispensePrescription.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(dispensePrescription.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.dispensingQueue = state.dispensingQueue.filter(
          (p) => p._id !== action.payload.emrId
        );
      })
      .addCase(dispensePrescription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Medicine
      .addCase(deleteMedicine.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteMedicine.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.medicines = state.medicines.filter((m) => m._id !== action.payload);
      })
      .addCase(deleteMedicine.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Inventory Stock Batch
      .addCase(deleteInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.inventory = state.inventory.filter((inv) => inv._id !== action.payload);
      })
      .addCase(deleteInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearPharmacyState,
  receiveSocketPrescriptionAlert,
  receiveSocketPrescriptionDispensed
} = pharmacySlice.actions;

export default pharmacySlice.reducer;
