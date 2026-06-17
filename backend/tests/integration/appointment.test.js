import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/User.js';
import Patient from '../../models/Patient.js';
import Appointment from '../../models/Appointment.js';
import DoctorAvailability from '../../models/DoctorAvailability.js';
import notificationService from '../../services/notificationService.js';

jest.spyOn(notificationService, 'dispatchNotification').mockImplementation(async () => true);

let mongoServer;
let testDoctor;
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
  await Appointment.deleteMany({});
  await DoctorAvailability.deleteMany({});

  // 1. Create doctor
  testDoctor = await User.create({
    email: 'doctor@hms.com',
    passwordHash: 'DocPass123!',
    firstName: 'Sarah',
    lastName: 'Connor',
    role: 'Doctor',
    isActive: true
  });

  // 2. Create patient
  testPatient = await Patient.create({
    patientId: 'PT-20260617-1122',
    firstName: 'Alice',
    lastName: 'Brown',
    dateOfBirth: new Date('1990-05-14'),
    gender: 'Female',
    contactNumber: '+15550199283',
    emergencyContact: {
      name: 'Robert Brown',
      relation: 'Spouse',
      phone: '+15550199284'
    }
  });

  // 3. Create doctor availability for standard Monday slot
  await DoctorAvailability.create({
    doctorId: testDoctor._id,
    dayOfWeek: 'Monday',
    slots: [{ startTime: '09:00', endTime: '10:00' }]
  });

  // 4. Log in doctor to get authorization token
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'doctor@hms.com', password: 'DocPass123!' });
  
  authToken = response.body.data.accessToken;
});

describe('Integration Test: Appointment Workflows', () => {
  test('POST /api/v1/appointments - should book successfully when slot is open', async () => {
    // 2026-06-22 is a Monday
    const payload = {
      patientId: testPatient._id.toString(),
      doctorId: testDoctor._id.toString(),
      appointmentDate: '2026-06-22T09:00:00.000Z',
      slot: { startTime: '09:00', endTime: '10:00' },
      reason: 'Regular consultation'
    };

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Requested');
  });

  test('POST /api/v1/appointments - should reject booking when slot is double-booked', async () => {
    const payload = {
      patientId: testPatient._id.toString(),
      doctorId: testDoctor._id.toString(),
      appointmentDate: '2026-06-22T09:00:00.000Z',
      slot: { startTime: '09:00', endTime: '10:00' },
      reason: 'Regular checkup'
    };

    // Book first appointment
    await Appointment.create({
      patientId: testPatient._id,
      doctorId: testDoctor._id,
      appointmentDate: new Date('2026-06-22T09:00:00.000Z'),
      slot: { startTime: '09:00', endTime: '10:00' },
      status: 'Confirmed'
    });

    // Try booking second time
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESOURCE_CONFLICT');
  });
});
