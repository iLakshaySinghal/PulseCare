import mongoose from 'mongoose';

const LabRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Ordering Doctor
    required: true
  },
  testType: {
    type: String,
    enum: ['Blood Test', 'X-Ray', 'MRI', 'CT Scan'],
    required: true
  },
  instructions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Ordered', 'Received', 'Sample Collected', 'Testing', 'Completed', 'Cancelled'],
    default: 'Ordered',
    required: true
  },
  sampleDetails: {
    sampleType: { type: String, trim: true },
    collectedAt: { type: Date },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Nurse or Technician who collected
      default: null
    }
  },
  billingStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
    required: true
  }
}, {
  timestamps: true
});

LabRequestSchema.index({ patientId: 1, status: 1 });
LabRequestSchema.index({ status: 1 });

export const LabRequest = mongoose.model('LabRequest', LabRequestSchema);
export default LabRequest;
