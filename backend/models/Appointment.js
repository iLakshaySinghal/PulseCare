import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  slot: {
    startTime: {
      type: String, // format HH:MM
      required: true
    },
    endTime: {
      type: String, // format HH:MM
      required: true
    }
  },
  status: {
    type: String,
    enum: ['Requested', 'Confirmed', 'In Consultation', 'Completed', 'Cancelled'],
    default: 'Requested',
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 300
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rescheduleCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for common queries
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
AppointmentSchema.index({ patientId: 1, appointmentDate: -1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ appointmentDate: 1 });

export const Appointment = mongoose.model('Appointment', AppointmentSchema);
export default Appointment;
