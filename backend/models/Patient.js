import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    match: [/^PT-\d{8}-\d{4}$/, 'Patient ID must follow PT-YYYYMMDD-XXXX format']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say']
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContact: {
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: null
  },
  allergies: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for search operations
PatientSchema.index({ firstName: 'text', lastName: 'text', patientId: 'text' });

export const Patient = mongoose.model('Patient', PatientSchema);
export default Patient;
