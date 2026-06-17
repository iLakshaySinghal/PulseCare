import mongoose from 'mongoose';

const ConsultationSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
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
  encounterDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress',
    required: true
  },
  vitals: {
    bloodPressure: {
      type: String,
      match: [/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be formatted as SBP/DBP (e.g. 120/80)']
    },
    heartRate: {
      type: Number,
      min: 30,
      max: 250
    },
    temperature: {
      type: Number,
      min: 90.0,
      max: 110.0
    }
  },
  clinicalNotes: {
    type: String,
    minlength: 5
  },
  diagnoses: [{
    code: {
      type: String,
      match: [/^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/, 'Must be a valid ICD-10 code format']
    },
    name: {
      type: String
    },
    status: {
      type: String,
      enum: ['Active', 'Resolved', 'Suspected']
    }
  }],
  prescriptions: [{
    drugName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true }
  }],
  treatmentPlan: {
    goal: { type: String, trim: true },
    instructions: { type: String, trim: true }
  },
  emrId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMR',
    default: null
  }
}, {
  timestamps: true
});

ConsultationSchema.index({ patientId: 1, encounterDate: -1 });
ConsultationSchema.index({ doctorId: 1, encounterDate: -1 });

export const Consultation = mongoose.model('Consultation', ConsultationSchema);
export default Consultation;
