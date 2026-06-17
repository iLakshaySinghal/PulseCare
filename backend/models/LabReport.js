import mongoose from 'mongoose';

const LabReportSchema = new mongoose.Schema({
  labRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabRequest',
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  testType: {
    type: String,
    enum: ['Blood Test', 'X-Ray', 'MRI', 'CT Scan'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  results: {
    type: String, // Textual synopsis / values summary
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Lab Technician
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reviewing Doctor
    default: null
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

LabReportSchema.index({ patientId: 1 });

export const LabReport = mongoose.model('LabReport', LabReportSchema);
export default LabReport;
