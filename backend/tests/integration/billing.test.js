import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/User.js';
import Patient from '../../models/Patient.js';
import Invoice from '../../models/Invoice.js';
import Payment from '../../models/Payment.js';
import auditService from '../../services/auditService.js';

jest.spyOn(auditService, 'logAuditEvent').mockImplementation(async () => true);

let mongoServer;
let testBillingExec;
let testPatient;
let authToken;

beforeAll(async () => {
  await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Patient.deleteMany({});
  await Invoice.deleteMany({});
  await Payment.deleteMany({});

  // Create billing executive
  testBillingExec = await User.create({
    email: 'billing@hms.com',
    passwordHash: 'BillingPass123!',
    firstName: 'John',
    lastName: 'Finance',
    role: 'Billing Executive',
    isActive: true
  });

  // Create patient
  testPatient = await Patient.create({
    patientId: 'PT-20260617-1122',
    firstName: 'Alice',
    lastName: 'Brown',
    dateOfBirth: new Date('1990-05-14'),
    gender: 'Female',
    contactNumber: '+15550199283',
    emergencyContact: { name: 'Robert Brown', relation: 'Spouse', phone: '+15550199284' }
  });

  // Login billing executive
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'billing@hms.com', password: 'BillingPass123!' });
  
  authToken = loginRes.body.data.accessToken;
});

describe('Integration Test: Billing & Invoice Workflows', () => {
  test('POST /api/v1/billing/invoices - should generate invoice successfully', async () => {
    const payload = {
      patientId: testPatient._id.toString(),
      items: [
        {
          source: 'Consultation',
          referenceId: new mongoose.Types.ObjectId(),
          name: 'General Consultation',
          quantity: 1,
          unitPrice: 150,
          totalPrice: 150
        }
      ],
      discount: 10,
      tax: 5
    };

    const res = await request(app)
      .post('/api/v1/billing/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.grandTotal).toBe(145); // 150 + 5 - 10
    expect(res.body.data.status).toBe('Unpaid');
  });

  test('POST /api/v1/billing/payments - should process payment and pay off invoice', async () => {
    // Seed an invoice first
    const invoice = await Invoice.create({
      invoiceId: 'INV-20260617-9872',
      patientId: testPatient._id,
      items: [
        {
          source: 'Consultation',
          referenceId: new mongoose.Types.ObjectId(),
          name: 'Consultation Fee',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100
        }
      ],
      subTotal: 100,
      grandTotal: 100,
      amountPaid: 0,
      amountDue: 100,
      status: 'Unpaid'
    });

    const payload = {
      invoiceId: invoice._id.toString(),
      paymentMethod: 'UPI',
      transactionReference: 'TXN99283711',
      amount: 100
    };

    const res = await request(app)
      .post('/api/v1/billing/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoice.status).toBe('Paid');
    expect(res.body.data.invoice.amountDue).toBe(0);
  });
});
