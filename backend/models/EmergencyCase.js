import mongoose from 'mongoose';

const EmergencyCaseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^ER-\d{8}-\d{4}$/, 'Case number must follow ER-YYYYMMDD-XXXX format']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null // Nullable for anonymous/unregistered emergency arrivals
  },
  anonymousPatientName: {
    type: String,
    trim: true,
    default: '' // e.g. "Unknown Male (~40s)"
  },
  triageDetails: {
    chiefComplaint: {
      type: String,
      required: true,
      trim: true
    },
    vitals: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number
    }
  },
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true
  },
  status: {
    type: String,
    enum: ['Registered', 'Triage', 'Doctor Assigned', 'Under Treatment', 'Discharged', 'Admitted'],
    default: 'Registered',
    required: true
  },
  assignedDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedNurseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  treatmentNotes: {
    type: String,
    trim: true
  },
  registeredAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  dischargedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

EmergencyCaseSchema.index({ status: 1, priority: 1 });

export const EmergencyCase = mongoose.model('EmergencyCase', EmergencyCaseSchema);
export default EmergencyCase;
