import fs from 'fs';
import path from 'path';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { generatePatientId } from '../utils/patientIdGenerator.js';
import auditService from '../services/auditService.js';
import notificationService from '../services/notificationService.js';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../utils/appError.js';
import logger from '../config/logger.js';

/**
 * POST /api/v1/patients
 * Register a new patient and optionally create their portal User account
 */
export const createPatient = async (req, res, next) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    contactNumber,
    email,
    emergencyContact,
    bloodGroup,
    allergies
  } = req.body;

  let associatedUser = null;

  // 1. If email is provided, handle User account creation
  if (email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ConflictError('A user account with this email address already exists.'));
    }

    // Auto-create a Patient portal account
    // Generate a default temporary password: e.g., Patient123!
    const tempPassword = 'Patient123!';
    associatedUser = await User.create({
      email,
      passwordHash: tempPassword,
      firstName,
      lastName,
      role: 'Patient'
    });
  }

  // 2. Generate custom unique Patient ID
  const patientId = await generatePatientId();

  // 3. Create Patient demographic sheet
  const newPatient = await Patient.create({
    patientId,
    userId: associatedUser ? associatedUser._id : null,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    contactNumber,
    emergencyContact,
    bloodGroup,
    allergies
  });

  // 4. Log audit event
  await auditService.logAuditEvent({
    userId: req.user.id,
    action: 'PATIENT_REGISTRATION',
    resource: 'Patient',
    resourceId: newPatient._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    changes: {
      before: null,
      after: {
        patientId,
        name: `${firstName} ${lastName}`,
        userId: associatedUser ? associatedUser._id : null
      }
    }
  });

  // 5. Send registration notification email
  if (associatedUser) {
    try {
      const templatePath = path.join(process.cwd(), 'templates', 'registrationEmail.html');
      const templateContent = fs.readFileSync(templatePath, 'utf8');

      await notificationService.dispatchNotification({
        recipientId: associatedUser._id,
        emailAddress: associatedUser.email,
        subject: 'Your HMS Patient Portal Account Created',
        htmlTemplate: templateContent,
        context: {
          firstName,
          lastName,
          email,
          role: 'Patient'
        }
      });
    } catch (err) {
      logger.error(`Welcome email failed for registered patient ${email}: ${err.message}`);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Patient registered successfully',
    data: newPatient
  });
};

/**
 * PUT /api/v1/patients/:id
 * Update patient demographics (Admin, Receptionist, or Patient Self)
 */
export const updatePatient = async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const patient = await Patient.findById(id);
  if (!patient) {
    return next(new NotFoundError('Patient record not found.'));
  }

  // RBAC Self-update constraint: if role is Patient, they must own the record
  if (req.user.role === 'Patient') {
    if (!patient.userId || String(patient.userId) !== req.user.id) {
      return next(new ForbiddenError('Access denied: You can only update your own profile.'));
    }
    
    // Safety check: Patients are not allowed to edit their clinical attributes directly
    delete updateData.bloodGroup;
    // Patient can only modify contact details
  }

  const beforeState = patient.toObject();

  // Perform updates
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      patient[key] = updateData[key];
    }
  });

  const updatedPatient = await patient.save();

  // Log audit event
  await auditService.logAuditEvent({
    userId: req.user.id,
    action: 'PATIENT_UPDATE',
    resource: 'Patient',
    resourceId: updatedPatient._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    changes: {
      before: beforeState,
      after: updatedPatient.toObject()
    }
  });

  res.status(200).json({
    success: true,
    message: 'Patient profile updated successfully',
    data: updatedPatient
  });
};

/**
 * GET /api/v1/patients/:id
 * Fetch detailed profile card (Admin, Receptionist, Doctor, Nurse, or Patient Self)
 */
export const getPatientById = async (req, res, next) => {
  const { id } = req.params;

  const patient = await Patient.findById(id).populate('userId', 'email firstName lastName role isActive');
  if (!patient) {
    return next(new NotFoundError('Patient record not found.'));
  }

  // Check Patient Self access restriction
  if (req.user.role === 'Patient') {
    if (!patient.userId || String(patient.userId._id) !== req.user.id) {
      return next(new ForbiddenError('Access denied: You can only access your own profile details.'));
    }
  }

  res.status(200).json({
    success: true,
    message: 'Patient record retrieved successfully',
    data: patient
  });
};

/**
 * GET /api/v1/patients
 * Query / Search all patients with pagination (Staff only)
 */
export const listPatients = async (req, res, next) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (search) {
    // Search by text index or prefix
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { patientId: { $regex: search, $options: 'i' } },
      { contactNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const patients = await Patient.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Patient.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: 'Patients list retrieved successfully',
    data: {
      patients,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
};

export default {
  createPatient,
  updatePatient,
  getPatientById,
  listPatients
};
