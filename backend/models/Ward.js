import mongoose from 'mongoose';

const WardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ward name is required'],
    unique: true,
    trim: true,
    maxlength: 100
  },
  department: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    maxlength: 100
  },
  totalBeds: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

WardSchema.index({ department: 1 });

export const Ward = mongoose.model('Ward', WardSchema);
export default Ward;
