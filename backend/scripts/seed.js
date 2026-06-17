import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import RefreshToken from '../models/RefreshToken.js';
import EMR from '../models/EMR.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    console.log('Clearing database collection data...');
    
    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await RefreshToken.deleteMany({});
    await EMR.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});

    console.log('Seeding user accounts...');

    const superAdminEmail = process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@hms.com';
    const superAdminPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD || 'SuperAdmin123!';

    // 1. Create Super Admin
    const superAdmin = await User.create({
      email: superAdminEmail,
      passwordHash: superAdminPassword,
      firstName: 'System',
      lastName: 'SuperAdmin',
      role: 'Super Admin',
      isActive: true
    });
    console.log(`Created Super Admin: ${superAdmin.email}`);

    // 2. Create Hospital Admin
    const hospitalAdmin = await User.create({
      email: 'admin@hms.com',
      passwordHash: 'Admin123!',
      firstName: 'Hospital',
      lastName: 'Admin',
      role: 'Hospital Admin',
      isActive: true
    });
    console.log(`Created Hospital Admin: ${hospitalAdmin.email}`);

    // 3. Create Doctor
    const doctor = await User.create({
      email: 'doctor@hms.com',
      passwordHash: 'Doctor123!',
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'Doctor',
      isActive: true
    });
    console.log(`Created Doctor: ${doctor.email}`);

    // 4. Create Nurse
    const nurse = await User.create({
      email: 'nurse@hms.com',
      passwordHash: 'Nurse123!',
      firstName: 'Emily',
      lastName: 'Jones',
      role: 'Nurse',
      isActive: true
    });
    console.log(`Created Nurse: ${nurse.email}`);

    // 5. Create Receptionist
    const receptionist = await User.create({
      email: 'receptionist@hms.com',
      passwordHash: 'Receptionist123!',
      firstName: 'Michael',
      lastName: 'Brown',
      role: 'Receptionist',
      isActive: true
    });
    console.log(`Created Receptionist: ${receptionist.email}`);

    // 6. Create Lab Technician
    const labtech = await User.create({
      email: 'labtech@hms.com',
      passwordHash: 'Labtech123!',
      firstName: 'David',
      lastName: 'Miller',
      role: 'Lab Technician',
      isActive: true
    });
    console.log(`Created Lab Technician: ${labtech.email}`);

    // 7. Create Pharmacist
    const pharmacist = await User.create({
      email: 'pharmacist@hms.com',
      passwordHash: 'Pharmacist123!',
      firstName: 'Lisa',
      lastName: 'Davis',
      role: 'Pharmacist',
      isActive: true
    });
    console.log(`Created Pharmacist: ${pharmacist.email}`);

    // 8. Create Billing Executive
    const billing = await User.create({
      email: 'billing@hms.com',
      passwordHash: 'Billing123!',
      firstName: 'Robert',
      lastName: 'Wilson',
      role: 'Billing Executive',
      isActive: true
    });
    console.log(`Created Billing Executive: ${billing.email}`);

    // 9. Create Patient User Account
    const patientUser = await User.create({
      email: 'patient@hms.com',
      passwordHash: 'Patient123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Patient',
      isActive: true
    });
    console.log(`Created Patient User Account: ${patientUser.email}`);

    // Create Patient Demographic Record associated to Patient User
    const patientProfile = await Patient.create({
      patientId: 'PT-20260617-0001',
      userId: patientUser._id,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Male',
      contactNumber: '+15550199283',
      emergencyContact: {
        name: 'Jane Doe',
        relation: 'Spouse',
        phone: '+15550199284'
      },
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Peanuts']
    });
    console.log(`Created Patient Demographic Record: ${patientProfile.patientId}`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seed();
