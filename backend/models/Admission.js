import mongoose from 'mongoose';

const InpatientVitalSchema = new mongoose.Schema({
  bloodPressure: {
    type: String,
    match: [/^\d{2,3}\/\d{2,3}$/, 'BP must be formatted as SBP/DBP']
  },
  heartRate: { type: Number, min: 30, max: 250 },
  temperature: { type: Number, min: 90.0, max: 110.0 },
  recordedAt: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const InpatientTreatmentSchema = new mongoose.Schema({
  treatmentNote: { type: String, required: true },
  administeredAt: { type: Date, default: Date.now },
  administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const AdmissionSchema = new mongoose.Schema({
  admissionId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient assignment is required']
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room assignment is required']
  },
  bedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    required: [true, 'Bed assignment is required']
  },
  admittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Doctor or Nurse
    required: [true, 'Admitting physician/staff is required']
  },
  reason: {
    type: String,
    required: [true, 'Admission reason is required'],
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true,
    default: ''
  },
  admissionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dischargeDate: {
    type: Date,
    default: null
  },
  dischargedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  dischargeSummary: {
    conditionAtDischarge: { type: String, default: '' },
    treatmentSummary: { type: String, default: '' },
    followUpInstructions: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['Admitted', 'Discharged'],
    default: 'Admitted',
    required: true
  },
  vitalsLog: [InpatientVitalSchema],
  treatmentLog: [InpatientTreatmentSchema],
  billingStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
    required: true
  }
}, {
  timestamps: true
});

AdmissionSchema.index({ patientId: 1, status: 1 });
AdmissionSchema.index({ roomId: 1 });
AdmissionSchema.index({ bedId: 1 });

export const Admission = mongoose.model('Admission', AdmissionSchema);
export default Admission;
