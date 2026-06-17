import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  supplier: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  reorderLevel: {
    type: Number,
    default: 10,
    min: 0
  }
}, {
  timestamps: true
});

// Single active stock entry per medicine batch
InventorySchema.index({ medicineId: 1, batchNumber: 1 }, { unique: true });
InventorySchema.index({ expiryDate: 1 });

export const Inventory = mongoose.model('Inventory', InventorySchema);
export default Inventory;
