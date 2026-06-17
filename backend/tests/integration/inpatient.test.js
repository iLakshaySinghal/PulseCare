import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/User.js';
import Patient from '../../models/Patient.js';
import Admission from '../../models/Admission.js';
import Room from '../../models/Room.js';
import Bed from '../../models/Bed.js';
import Ward from '../../models/Ward.js';
import auditService from '../../services/auditService.js';

jest.spyOn(auditService, 'logAuditEvent').mockImplementation(async () => true);

let mongoServer;
let testNurse;
let testPatient;
let testRoom;
let testBed;
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
  await Admission.deleteMany({});
  await Room.deleteMany({});
  await Bed.deleteMany({});
  await Ward.deleteMany({});

  // Create nurse
  testNurse = await User.create({
    email: 'nurse@hms.com',
    passwordHash: 'NursePass123!',
    firstName: 'Jane',
    lastName: 'Rounds',
    role: 'Nurse',
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

  // Create Ward, Room, Bed
  const ward = await Ward.create({ name: 'General Ward A', department: 'Medicine', totalBeds: 1 });
  testRoom = await Room.create({ roomNumber: '101', wardId: ward._id, roomType: 'General', chargesPerDay: 150 });
  testBed = await Bed.create({ bedNumber: 'Bed-1', roomId: testRoom._id, isOccupied: false });

  // Login nurse
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'nurse@hms.com', password: 'NursePass123!' });
  
  authToken = loginRes.body.data.accessToken;
});

describe('Integration Test: Inpatient Admission Workflows', () => {
  test('POST /api/v1/admissions - should admit patient and mark bed occupied', async () => {
    const payload = {
      patientId: testPatient._id.toString(),
      roomId: testRoom._id.toString(),
      bedId: testBed._id.toString(),
      reason: 'Pneumonia observation',
      diagnosis: 'Severe lobar pneumonia'
    };

    const res = await request(app)
      .post('/api/v1/admissions')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Admitted');

    // Verify bed is occupied
    const checkBed = await Bed.findById(testBed._id);
    expect(checkBed.isOccupied).toBe(true);
  });

  test('POST /api/v1/admissions/:id/discharge - should discharge patient and vacant bed', async () => {
    // Seed admission
    const admission = await Admission.create({
      admissionId: 'ADM-20260617-8822',
      patientId: testPatient._id,
      roomId: testRoom._id,
      bedId: testBed._id,
      reason: 'General observation',
      admittedBy: testNurse._id,
      status: 'Admitted'
    });

    testBed.isOccupied = true;
    await testBed.save();

    const payload = {
      conditionAtDischarge: 'Stable',
      treatmentSummary: 'Patient rested well. Resolved hydration deficiency.',
      followUpInstructions: 'Return in 1 week.'
    };

    const res = await request(app)
      .post(`/api/v1/admissions/${admission._id}/discharge`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Discharged');

    // Verify bed is vacant
    const checkBed = await Bed.findById(testBed._id);
    expect(checkBed.isOccupied).toBe(false);
  });
});
