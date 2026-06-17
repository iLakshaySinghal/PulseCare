import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    enum: ['Consultation', 'Lab', 'Medicine', 'Admission', 'Emergency']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient assignment is required']
  },
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    default: null
  },
  items: [InvoiceItemSchema],
  subTotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  amountDue: {
    type: Number,
    required: true,
    min: 0
  },
  insuranceDetails: {
    providerName: { type: String, default: '' },
    policyNumber: { type: String, default: '' },
    claimedAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Not Claimed', 'Submitted', 'Approved', 'Rejected'],
      default: 'Not Claimed'
    },
    approvedAmount: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Refunded', 'Cancelled'],
    default: 'Unpaid',
    required: true
  },
  billingExecutiveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

InvoiceSchema.index({ patientId: 1 });
InvoiceSchema.index({ status: 1 });

export const Invoice = mongoose.model('Invoice', InvoiceSchema);
export default Invoice;
