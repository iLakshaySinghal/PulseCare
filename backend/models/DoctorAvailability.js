import mongoose from 'mongoose';

const TimeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String, // HH:MM
    required: true
  },
  endTime: {
    type: String, // HH:MM
    required: true
  }
}, { _id: false });

const AvailabilityExceptionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  isAvailable: {
    type: Boolean,
    required: true
  },
  slots: [TimeSlotSchema]
}, { _id: false });

const DoctorAvailabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  slots: [TimeSlotSchema],
  exceptions: [AvailabilityExceptionSchema]
}, {
  timestamps: true
});

// Single active availability plan per doctor per day
DoctorAvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

export const DoctorAvailability = mongoose.model('DoctorAvailability', DoctorAvailabilitySchema);
export default DoctorAvailability;
