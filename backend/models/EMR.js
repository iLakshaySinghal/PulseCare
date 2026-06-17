import mongoose from 'mongoose';

const EMRSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  encounterDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  vitals: {
    bloodPressure: {
      type: String,
      required: true,
      match: [/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be formatted as SBP/DBP (e.g. 120/80)']
    },
    heartRate: {
      type: Number,
      required: true,
      min: 30,
      max: 250
    },
    temperature: {
      type: Number,
      required: true,
      min: 90.0,
      max: 110.0
    }
  },
  clinicalNotes: {
    type: String,
    required: true,
    minlength: 10
  },
  diagnoses: [{
    code: {
      type: String,
      required: true,
      match: [/^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/, 'Must be a valid ICD-10 code format']
    },
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Resolved', 'Suspected']
    }
  }],
  prescriptions: [{
    drugName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true }
  }],
  attachments: [{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound index to quickly fetch history of a patient ordered by date
EMRSchema.index({ patientId: 1, encounterDate: -1 });

export const EMR = mongoose.model('EMR', EMRSchema);
export default EMR;
