import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    unique: true,
    trim: true,
    maxlength: 20
  },
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: [true, 'Ward assignment is required']
  },
  roomType: {
    type: String,
    required: [true, 'Room type is required'],
    enum: {
      values: ['General', 'Semi-Private', 'Private', 'ICU'],
      message: 'Room type must be General, Semi-Private, Private, or ICU'
    }
  },
  chargesPerDay: {
    type: Number,
    required: [true, 'Daily charge rate is required'],
    min: [0, 'Charges cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

RoomSchema.index({ wardId: 1 });

export const Room = mongoose.model('Room', RoomSchema);
export default Room;
