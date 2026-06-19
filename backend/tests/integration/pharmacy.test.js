import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/User.js';
import Medicine from '../../models/Medicine.js';
import Inventory from '../../models/Inventory.js';
import DispenseRecord from '../../models/DispenseRecord.js';
import auditService from '../../services/auditService.js';

jest.spyOn(auditService, 'logAuditEvent').mockImplementation(async () => true);

let mongoServer;
let testPharmacist;
let testMedicine;
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
  await Medicine.deleteMany({});
  await Inventory.deleteMany({});

  // Create Pharmacist
  testPharmacist = await User.create({
    email: 'pharmacist.test@hms.com',
    passwordHash: 'PharmacistPass123!',
    firstName: 'Jane',
    lastName: 'Apothecary',
    role: 'Pharmacist',
    isActive: true
  });

  // Create Medicine
  testMedicine = await Medicine.create({
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin',
    form: 'Capsule',
    strength: '500mg',
    manufacturer: 'BioPharma Inc'
  });

  // Login
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'pharmacist.test@hms.com', password: 'PharmacistPass123!' });
  
  authToken = loginRes.body.data.accessToken;
});

describe('Integration Test: Pharmacy Inventory & Stock Control', () => {
  test('POST /api/v1/pharmacy/inventory - should add a new stock batch successfully', async () => {
    const payload = {
      medicineId: testMedicine._id.toString(),
      stock: 100,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days in future
      supplier: 'Global Pharma',
      batchNumber: 'B-AMX500-T1',
      unitPrice: 15.5
    };

    const res = await request(app)
      .post('/api/v1/pharmacy/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.batchNumber).toBe('B-AMX500-T1');
    expect(res.body.data.stock).toBe(100);
  });

  test('POST /api/v1/pharmacy/inventory - should return 409 Conflict when adding a duplicate stock batch', async () => {
    const payload = {
      medicineId: testMedicine._id.toString(),
      stock: 100,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplier: 'Global Pharma',
      batchNumber: 'B-AMX500-T2',
      unitPrice: 15.5
    };

    // First request should succeed
    const res1 = await request(app)
      .post('/api/v1/pharmacy/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);
    expect(res1.status).toBe(201);

    // Second request with same batch number should trigger conflict
    const res2 = await request(app)
      .post('/api/v1/pharmacy/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error.code).toBe('RESOURCE_CONFLICT');
    expect(res2.body.error.message).toContain('already exists');
  });

  test('POST /api/v1/pharmacy/inventory - should map MongoDB duplicate key index violation to 409 Conflict', async () => {
    const payload = {
      medicineId: testMedicine._id.toString(),
      stock: 100,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplier: 'Global Pharma',
      batchNumber: 'B-AMX500-T3',
      unitPrice: 15.5
    };

    // Create the batch once
    const res1 = await request(app)
      .post('/api/v1/pharmacy/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);
    expect(res1.status).toBe(201);

    // Mock Inventory.findOne to return null, bypassing service-level pre-flight check
    jest.spyOn(Inventory, 'findOne').mockResolvedValue(null);

    // Try to create the duplicate batch. Service preflight check is bypassed,
    // so it executes Inventory.create which triggers a raw E11000 MongoDB duplicate key index violation.
    const res2 = await request(app)
      .post('/api/v1/pharmacy/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error.code).toBe('RESOURCE_CONFLICT');
    expect(res2.body.error.message).toContain('Conflict detected');

    // Restore findOne mock
    Inventory.findOne.mockRestore();
  });

  test('DELETE /api/v1/pharmacy/inventory/:id - should delete a stock batch successfully', async () => {
    // Seed an inventory batch
    const inventoryBatch = await Inventory.create({
      medicineId: testMedicine._id,
      stock: 50,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      supplier: 'Global Pharma',
      batchNumber: 'B-DEL-BATCH-1',
      unitPrice: 10
    });

    const res = await request(app)
      .delete(`/api/v1/pharmacy/inventory/${inventoryBatch._id.toString()}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted successfully');

    // Verify deleted from DB
    const dbBatch = await Inventory.findById(inventoryBatch._id);
    expect(dbBatch).toBeNull();
  });

  test('DELETE /api/v1/pharmacy/medicines/:id - should cascade delete all stock batches associated with the medicine', async () => {
    // Seed two inventory batches for the medicine
    await Inventory.create({
      medicineId: testMedicine._id,
      stock: 50,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      supplier: 'Global Pharma',
      batchNumber: 'B-CASC-1',
      unitPrice: 10
    });

    await Inventory.create({
      medicineId: testMedicine._id,
      stock: 20,
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      supplier: 'Global Pharma',
      batchNumber: 'B-CASC-2',
      unitPrice: 12
    });

    const res = await request(app)
      .delete(`/api/v1/pharmacy/medicines/${testMedicine._id.toString()}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted successfully');

    // Verify medicine is deleted
    const dbMed = await Medicine.findById(testMedicine._id);
    expect(dbMed).toBeNull();

    // Verify all associated inventory batches are cascade deleted
    const dbBatches = await Inventory.find({ medicineId: testMedicine._id });
    expect(dbBatches.length).toBe(0);
  });

  test('DELETE /api/v1/pharmacy/medicines/:id - should fail with 409 Conflict if historical dispense logs reference it', async () => {
    // Seed a dispense record for this medicine
    await DispenseRecord.create({
      emrId: new mongoose.Types.ObjectId(),
      patientId: new mongoose.Types.ObjectId(),
      pharmacistId: testPharmacist._id,
      dispensedMedicines: [{ medicineId: testMedicine._id, quantity: 5, batchNumber: 'B-HIST-1' }],
      status: 'Dispensed'
    });

    const res = await request(app)
      .delete(`/api/v1/pharmacy/medicines/${testMedicine._id.toString()}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESOURCE_CONFLICT');
    expect(res.body.error.message).toContain('historical dispensing logs reference');

    // Verify medicine is NOT deleted
    const dbMed = await Medicine.findById(testMedicine._id);
    expect(dbMed).not.toBeNull();
  });
});
