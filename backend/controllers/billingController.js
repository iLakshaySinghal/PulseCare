import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import LabRequest from '../models/LabRequest.js';
import Admission from '../models/Admission.js';
import Patient from '../models/Patient.js';
import billingService from '../services/billingService.js';
import auditService from '../services/auditService.js';
import notificationService from '../services/notificationService.js';
import { getIO } from '../config/socket.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/appError.js';
import logger from '../config/logger.js';

// Helper to generate Invoice ID: INV-YYYYMMDD-XXXX
const generateInvoiceId = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${randomSuffix}`;
};

// Helper to generate Payment ID: PAY-YYYYMMDD-XXXX
const generatePaymentId = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${dateStr}-${randomSuffix}`;
};

/**
 * GET /api/v1/billing/unbilled/:patientId
 */
export const getUnbilledItemsController = async (req, res, next) => {
  const { patientId } = req.params;
  const items = await billingService.getUnbilledItems(patientId);

  res.status(200).json({
    success: true,
    data: items
  });
};

/**
 * POST /api/v1/billing/invoices
 */
export const createInvoice = async (req, res, next) => {
  const { patientId, admissionId, items, discount = 0, tax = 0 } = req.body;

  if (!patientId || !items || items.length === 0) {
    return next(new ValidationError('patientId and billing items are required'));
  }

  // Double check Patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return next(new NotFoundError('Patient record not found'));
  }

  // Calculate invoice sums
  const subTotal = items.reduce((sum, item) => sum + (item.totalPrice || (item.quantity * item.unitPrice)), 0);
  const grandTotal = Math.max(0, subTotal + tax - discount);
  const invoiceId = await generateInvoiceId();

  const invoice = await Invoice.create({
    invoiceId,
    patientId,
    admissionId: admissionId || null,
    items,
    subTotal,
    tax,
    discount,
    grandTotal,
    amountPaid: 0,
    amountDue: grandTotal,
    status: 'Unpaid',
    billingExecutiveId: req.user.id
  });

  // Audit Log
  await auditService.logAuditEvent({
    userId: req.user.id,
    action: 'INVOICE_GENERATION',
    resource: 'Invoice',
    resourceId: invoice._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    changes: { before: null, after: invoice.toObject() }
  });

  // Emit WebSocket notification
  try {
    const io = getIO();
    io.to(`user_${patient.userId}`).emit('invoice_created', {
      invoiceId: invoice.invoiceId,
      grandTotal: invoice.grandTotal
    });
    io.to('role_Billing Executive').emit('live_billing_update');
  } catch (err) {
    logger.debug(`Socket emit for invoice registration failed: ${err.message}`);
  }

  res.status(201).json({
    success: true,
    message: 'Invoice generated successfully',
    data: invoice
  });
};

/**
 * GET /api/v1/billing/invoices/:id
 */
export const getInvoiceById = async (req, res, next) => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id)
    .populate('patientId')
    .populate('billingExecutiveId', 'firstName lastName email');

  if (!invoice) {
    return next(new NotFoundError('Invoice not found'));
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
};

/**
 * GET /api/v1/billing/invoices
 */
export const listInvoices = async (req, res, next) => {
  const { page = 1, limit = 10, status, search = '' } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  if (search) {
    // Search by invoiceId
    query.invoiceId = { $regex: search, $options: 'i' };
  }

  // If role is Patient, force filter to their own invoices
  if (req.user.role === 'Patient') {
    const patientProfile = await Patient.findOne({ userId: req.user.id });
    if (!patientProfile) {
      return res.status(200).json({
        success: true,
        data: { invoices: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } }
      });
    }
    query.patientId = patientProfile._id;
  }

  const invoices = await Invoice.find(query)
    .populate('patientId', 'firstName lastName patientId contactNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Invoice.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      invoices,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
};

/**
 * POST /api/v1/billing/payments
 */
export const processPayment = async (req, res, next) => {
  const { invoiceId, paymentMethod, transactionReference, amount } = req.body;

  if (!invoiceId || !paymentMethod || !amount) {
    return next(new ValidationError('invoiceId, paymentMethod and amount are required'));
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return next(new NotFoundError('Invoice not found'));
  }

  if (invoice.status === 'Paid' || invoice.status === 'Refunded') {
    return next(new ConflictError(`This invoice is already marked as ${invoice.status}`));
  }

  if (amount > invoice.amountDue) {
    return next(new ValidationError(`Payment amount exceeds outstanding due of ${invoice.amountDue}`));
  }

  const paymentId = await generatePaymentId();

  // Create payment record
  const payment = await Payment.create({
    paymentId,
    invoiceId,
    patientId: invoice.patientId,
    paymentMethod,
    transactionReference: transactionReference || '',
    amount,
    status: 'Completed',
    processedBy: req.user.role !== 'Patient' ? req.user.id : null
  });

  const beforeInvoiceState = invoice.toObject();

  // Update invoice states
  invoice.amountPaid += amount;
  invoice.amountDue = Math.max(0, invoice.grandTotal - invoice.amountPaid);
  
  if (invoice.amountDue === 0) {
    invoice.status = 'Paid';
    
    // Update references billingStatus
    for (const item of invoice.items) {
      if (item.source === 'Lab') {
        await LabRequest.findByIdAndUpdate(item.referenceId, { billingStatus: 'Paid' });
      }
      if (item.source === 'Admission') {
        await Admission.findByIdAndUpdate(item.referenceId, { billingStatus: 'Paid' });
      }
    }
  } else {
    invoice.status = 'Partially Paid';
  }

  await invoice.save();

  // Log Audit
  await auditService.logAuditEvent({
    userId: req.user.id,
    action: 'INVOICE_PAYMENT',
    resource: 'Payment',
    resourceId: payment._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    changes: { before: beforeInvoiceState, after: invoice.toObject() }
  });

  // WebSocket notifications
  try {
    const io = getIO();
    const patientProfile = await Patient.findById(invoice.patientId);
    if (patientProfile && patientProfile.userId) {
      io.to(`user_${patientProfile.userId}`).emit('payment_completed', {
        invoiceId: invoice.invoiceId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: invoice.status
      });
    }
    io.to('role_Billing Executive').emit('live_billing_update');
    io.to('role_Hospital Admin').emit('live_kpi_update');
  } catch (err) {
    logger.debug(`Socket event emit failed on payment completion: ${err.message}`);
  }

  res.status(201).json({
    success: true,
    message: 'Payment processed successfully',
    data: { payment, invoice }
  });
};

/**
 * POST /api/v1/billing/insurance/claim
 */
export const submitInsuranceClaim = async (req, res, next) => {
  const { invoiceId, providerName, policyNumber, claimedAmount } = req.body;

  if (!invoiceId || !providerName || !policyNumber || !claimedAmount) {
    return next(new ValidationError('All insurance inputs are required'));
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return next(new NotFoundError('Invoice not found'));
  }

  invoice.insuranceDetails = {
    providerName,
    policyNumber,
    claimedAmount,
    status: 'Submitted',
    approvedAmount: 0
  };

  await invoice.save();

  res.status(200).json({
    success: true,
    message: 'Insurance claim submitted successfully',
    data: invoice
  });
};

/**
 * POST /api/v1/billing/insurance/approve
 */
export const processInsuranceApproval = async (req, res, next) => {
  const { invoiceId, status, approvedAmount } = req.body;

  if (!invoiceId || !status || !['Approved', 'Rejected'].includes(status)) {
    return next(new ValidationError('Valid invoiceId, status (Approved/Rejected) are required'));
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return next(new NotFoundError('Invoice not found'));
  }

  const amount = status === 'Approved' ? parseFloat(approvedAmount) : 0;

  invoice.insuranceDetails.status = status;
  invoice.insuranceDetails.approvedAmount = amount;

  if (amount > 0) {
    const paymentId = await generatePaymentId();
    await Payment.create({
      paymentId,
      invoiceId: invoice._id,
      patientId: invoice.patientId,
      paymentMethod: 'Insurance',
      transactionReference: `INS-POL-${invoice.insuranceDetails.policyNumber}`,
      amount,
      status: 'Completed',
      processedBy: req.user.id
    });

    invoice.amountPaid += amount;
    invoice.amountDue = Math.max(0, invoice.grandTotal - invoice.amountPaid);
    invoice.status = invoice.amountDue === 0 ? 'Paid' : 'Partially Paid';

    if (invoice.status === 'Paid') {
      for (const item of invoice.items) {
        if (item.source === 'Lab') {
          await LabRequest.findByIdAndUpdate(item.referenceId, { billingStatus: 'Paid' });
        }
        if (item.source === 'Admission') {
          await Admission.findByIdAndUpdate(item.referenceId, { billingStatus: 'Paid' });
        }
      }
    }
  }

  await invoice.save();

  // Socket notification
  try {
    const io = getIO();
    io.to('role_Billing Executive').emit('live_billing_update');
  } catch (err) {
    logger.debug(`Socket update emit failed on insurance approval: ${err.message}`);
  }

  res.status(200).json({
    success: true,
    message: `Insurance claim ${status.toLowerCase()} successfully`,
    data: invoice
  });
};

export default {
  getUnbilledItemsController,
  createInvoice,
  getInvoiceById,
  listInvoices,
  processPayment,
  submitInsuranceClaim,
  processInsuranceApproval
};
