import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import EMR from '../models/EMR.js';
import Consultation from '../models/Consultation.js';
import LabRequest from '../models/LabRequest.js';
import DispenseRecord from '../models/DispenseRecord.js';
import Medicine from '../models/Medicine.js';
import Inventory from '../models/Inventory.js';
import Ward from '../models/Ward.js';
import Room from '../models/Room.js';
import Bed from '../models/Bed.js';

dotenv.config();

const seedExtra = async () => {
  try {
    await connectDB();
    console.log('Seeding Member 3 extra test data...');

    // Find Doctor & Patient
    const doctor = await User.findOne({ role: 'Doctor' });
    const patient = await Patient.findOne({ patientId: 'PT-20260617-0001' });

    if (!doctor || !patient) {
      console.error('Core Doctor/Patient seeds not found. Please run core seed first.');
      process.exit(1);
    }

    // 1. Wards & Rooms
    await Ward.deleteMany({});
    await Room.deleteMany({});
    await Bed.deleteMany({});

    const wardA = await Ward.create({ name: 'General Ward A', department: 'General Medicine', totalBeds: 3 });
    const wardICU = await Ward.create({ name: 'ICU Ward 1', department: 'Critical Care', totalBeds: 2 });
    console.log('Created Wards.');

    const room101 = await Room.create({ roomNumber: '101', wardId: wardA._id, roomType: 'General', chargesPerDay: 150 });
    const room102 = await Room.create({ roomNumber: '102', wardId: wardICU._id, roomType: 'ICU', chargesPerDay: 450 });
    console.log('Created Rooms.');

    const bed1 = await Bed.create({ bedNumber: 'Bed-1', roomId: room101._id, isOccupied: false });
    const bed2 = await Bed.create({ bedNumber: 'Bed-2', roomId: room101._id, isOccupied: false });
    const bed3 = await Bed.create({ bedNumber: 'Bed-3', roomId: room101._id, isOccupied: false });

    const bedA = await Bed.create({ bedNumber: 'Bed-A', roomId: room102._id, isOccupied: false });
    const bedB = await Bed.create({ bedNumber: 'Bed-B', roomId: room102._id, isOccupied: false });
    console.log('Created Beds.');

    // 2. Mock Consultation for John Doe (Unbilled)
    await Consultation.deleteMany({});
    const consult = await Consultation.create({
      appointmentId: new mongoose.Types.ObjectId(), // mock unique id
      patientId: patient._id,
      doctorId: doctor._id,
      encounterDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'Completed',
      vitals: { bloodPressure: '120/80', heartRate: 72, temperature: 98.6 },
      clinicalNotes: 'Patient complains of fever and body pain. Suspected influenza.',
      diagnoses: [{ code: 'J11.1', name: 'Influenza due to unidentified influenza virus', status: 'Active' }],
      prescriptions: [{ drugName: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '5 days' }]
    });
    console.log('Created completed unbilled doctor Consultation.');

    // 3. Mock Lab Request for John Doe (Unbilled)
    await LabRequest.deleteMany({});
    const lab = await LabRequest.create({
      patientId: patient._id,
      doctorId: doctor._id,
      testType: 'Blood Test',
      instructions: 'Check CBC and inflammatory markers.',
      status: 'Completed',
      billingStatus: 'Pending'
    });
    console.log('Created completed unbilled Lab Request.');

    // 4. Mock Medicines, Inventory & Dispense Record (Unbilled)
    await Medicine.deleteMany({});
    await DispenseRecord.deleteMany({});
    await Inventory.deleteMany({});

    const med1 = await Medicine.create({
      name: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      form: 'Tablet',
      strength: '500mg',
      manufacturer: 'Generic Labs'
    });

    const med2 = await Medicine.create({
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      form: 'Capsule',
      strength: '500mg',
      manufacturer: 'BioPharma Inc'
    });

    const med3 = await Medicine.create({
      name: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen',
      form: 'Tablet',
      strength: '400mg',
      manufacturer: 'HealthMed Solutions'
    });
    console.log('Created Medicines catalog.');

    // Seed Inventory batches
    await Inventory.create({
      medicineId: med1._id,
      stock: 135,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      supplier: 'Global Pharma Distributors',
      batchNumber: 'B-PC500-11',
      unitPrice: 0.10,
      reorderLevel: 20
    });

    await Inventory.create({
      medicineId: med2._id,
      stock: 80,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      supplier: 'Astra Supplies',
      batchNumber: 'B-AMX500-02',
      unitPrice: 0.45,
      reorderLevel: 15
    });

    await Inventory.create({
      medicineId: med3._id,
      stock: 8, // low stock
      expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // expired 5 days ago (triggers warning badge)
      supplier: 'QuickMeds Wholesalers',
      batchNumber: 'B-IBU400-09',
      unitPrice: 0.25,
      reorderLevel: 10
    });
    console.log('Created Inventory stock ledger entries.');

    const dispense = await DispenseRecord.create({
      emrId: new mongoose.Types.ObjectId(),
      patientId: patient._id,
      pharmacistId: doctor._id, // fallback pharmacist ref
      dispensedMedicines: [{ medicineId: med1._id, quantity: 15, batchNumber: 'B-PC500-11' }],
      status: 'Dispensed'
    });
    console.log('Created pharmacy Dispense Record.');

    console.log('Extra Member 3 test data seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Extra seeding failed:', err.message);
    process.exit(1);
  }
};

seedExtra();
