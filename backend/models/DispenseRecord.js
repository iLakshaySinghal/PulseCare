import mongoose from 'mongoose';

const DispensedItemSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  batchNumber: {
    type: String,
    required: true
  }
}, { _id: false });

const DispenseRecordSchema = new mongoose.Schema({
  emrId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMR',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  pharmacistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Pharmacist role
    required: true
  },
  dispensedMedicines: [DispensedItemSchema],
  status: {
    type: String,
    enum: ['Pending', 'Dispensed', 'Out of Stock'],
    default: 'Dispensed',
    required: true
  },
  dispensedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

DispenseRecordSchema.index({ patientId: 1 });
DispenseRecordSchema.index({ emrId: 1 });

export const DispenseRecord = mongoose.model('DispenseRecord', DispenseRecordSchema);
export default DispenseRecord;
