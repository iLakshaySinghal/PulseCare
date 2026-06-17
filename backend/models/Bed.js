import mongoose from 'mongoose';

const BedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: [true, 'Bed number is required'],
    trim: true,
    maxlength: 20
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room reference is required']
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure compound uniqueness of bed number inside a single room
BedSchema.index({ roomId: 1, bedNumber: 1 }, { unique: true });
BedSchema.index({ isOccupied: 1 });

export const Bed = mongoose.model('Bed', BedSchema);
export default Bed;
