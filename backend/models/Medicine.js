import mongoose from 'mongoose';

const MedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  genericName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  form: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Other'],
    required: true
  },
  strength: {
    type: String, // E.g., "500mg", "10ml"
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for search suggestions
MedicineSchema.index({ name: 'text', genericName: 'text' });

export const Medicine = mongoose.model('Medicine', MedicineSchema);
export default Medicine;
