import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: [true, 'Invoice reference is required']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient reference is required']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['UPI', 'Debit Card', 'Credit Card', 'Cash', 'Insurance']
  },
  transactionReference: {
    type: String,
    trim: true,
    default: ''
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than zero']
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Completed',
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // System/online payment if null
  },
  paidAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ patientId: 1 });

export const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
