import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../models/User.js';
import notificationService from '../../services/notificationService.js';

// Mock notifications to prevent slow dynamic Ethereal SMTP account generation and network calls
jest.spyOn(notificationService, 'dispatchNotification').mockImplementation(async () => true);

let mongoServer;

beforeAll(async () => {
  // Disconnect from standard database first if connected
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
  // Clean users before each test runs
  await User.deleteMany({});
});

describe('Integration Test: Authentication Routes', () => {
  test('POST /api/v1/auth/login - should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@hms.com', password: 'Password123!' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
  });

  test('POST /api/v1/auth/register-patient - should register a new patient account', async () => {
    const patientPayload = {
      email: 'testpatient@hms.com',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: '1995-10-10',
      gender: 'Female',
      contactNumber: '+15559876543',
      emergencyContact: {
        name: 'John Doe',
        relation: 'Spouse',
        phone: '+15559876542'
      }
    };

    const response = await request(app)
      .post('/api/v1/auth/register-patient')
      .send(patientPayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('testpatient@hms.com');
    expect(response.body.data.patientId).toBeDefined();

    // Verify user saved in DB
    const dbUser = await User.findOne({ email: 'testpatient@hms.com' });
    expect(dbUser).toBeDefined();
    expect(dbUser.role).toBe('Patient');
  });

  test('POST /api/v1/auth/login - should log in and set cookies', async () => {
    // Pre-create user in database
    await User.create({
      email: 'doctor.test@hms.com',
      passwordHash: 'DocPass123!',
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'Doctor',
      isActive: true
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doctor.test@hms.com', password: 'DocPass123!' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.role).toBe('Doctor');
    
    // Check if refresh cookie was set
    const cookies = response.headers['set-cookie'] || [];
    const refreshCookie = cookies.find((c) => c.includes('refreshToken='));
    expect(refreshCookie).toBeDefined();
  });
});
