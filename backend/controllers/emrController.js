import fs from 'fs';
import path from 'path';
import EMR from '../models/EMR.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import storageService from '../services/storageService.js';
import auditService from '../services/auditService.js';
import notificationService from '../services/notificationService.js';
import { AppError, NotFoundError, ForbiddenError } from '../utils/appError.js';
import logger from '../config/logger.js';

/**
 * POST /api/v1/emr
 * Create a new EMR clinical encounter entry (Doctor or Nurse only)
 */
export const createEMREntry = async (req, res, next) => {
  const { patientId, vitals, clinicalNotes, diagnoses, prescriptions } = req.body;

  // 1. Verify patient exists
  const patient = await Patient.findById(patientId).populate('userId');
  if (!patient) {
    return next(new NotFoundError('Patient profile not found.'));
  }

  // 2. Create EMR document
  const emrEntry = await EMR.create({
    patientId,
    providerId: req.user.id,
    vitals,
    clinicalNotes,
    diagnoses,
    prescriptions: prescriptions || [],
    attachments: []
  });

  // 3. Log audit trail
  await auditService.logAuditEvent({
    userId: req.user.id,
    action: 'EMR_CREATION',
    resource: 'EMR',
    resourceId: emrEntry._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    changes: {
      before: null,
      after: emrEntry.toObject()
    }
  });

  // 4. Dispatch alert email to patient if they have a portal account
  if (patient.userId && patient.userId.email) {
    try {
      const templatePath = path.join(process.cwd(), 'templates', 'reportReady.html');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      const providerUser = await User.findById(req.user.id);
      const providerName = providerUser ? `${providerUser.firstName} ${providerUser.lastName}` : 'Medical Provider';
      const patientName = `${patient.firstName} ${patient.lastName}`;

      await notificationService.dispatchNotification({
        recipientId: patient.userId._id,
        emailAddress: patient.userId.email,
        subject: 'New Medical Record Entry Released',
        htmlTemplate: templateContent,
        context: {
          patientName,
          providerName,
          encounterDate: new Date(emrEntry.encounterDate).toLocaleDateString()
        }
      });
    } catch (err) {
      logger.error(`Notification email failed for EMR creation alert: ${err.message}`);
    }
  }

  res.status(201).json({
    success: true,
    message: 'EMR entry recorded successfully',
    data: emrEntry
  });
};

/**
 * GET /api/v1/emr/patient/:patientId
 * Retrieve EMR ledger history of a Patient (Admin, Doctor, Nurse, Pharmacist, Patient Self)
 */
export const getEMRHistoryByPatient = async (req, res, next) => {
  const { patientId } = req.params;

  // 1. Check patient profile exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return next(new NotFoundError('Patient profile not found.'));
  }

  // 2. Patient Self access verification
  if (req.user.role === 'Patient') {
    if (!patient.userId || String(patient.userId) !== req.user.id) {
      return next(new ForbiddenError('Access denied: You can only retrieve your own clinical ledger.'));
    }
  }

  // 3. Fetch history, populate provider metadata
  const emrHistory = await EMR.find({ patientId })
    .populate('providerId', 'firstName lastName role')
    .sort({ encounterDate: -1 });

  // 4. Generate signed URLs for attachments to guarantee HIPAA compliance
  const sanitizedHistory = emrHistory.map((entry) => {
    const entryObj = entry.toObject();
    if (entryObj.attachments && entryObj.attachments.length > 0) {
      entryObj.attachments = entryObj.attachments.map((file) => ({
        ...file,
        // Sign secure URLs dynamically
        fileUrl: storageService.generateSignedUrl(file.fileUrl)
      }));
    }
    return entryObj;
  });

  res.status(200).json({
    success: true,
    message: 'EMR clinical records history retrieved successfully',
    data: sanitizedHistory
  });
};

/**
 * POST /api/v1/emr/:id/attachments
 * Upload clinical images or documents to Cloudinary / Local storage and attach to EMR entry
 */
export const uploadEMRAttachment = async (req, res, next) => {
  const { id } = req.params;

  if (!req.file) {
    return next(new AppError('No attachment file uploaded', 400, 'BAD_REQUEST'));
  }

  // 1. Verify EMR encounter exists
  const emrEntry = await EMR.findById(id);
  if (!emrEntry) {
    return next(new NotFoundError('EMR encounter record not found.'));
  }

  // 2. Upload using storage service stream
  try {
    const uploadResult = await storageService.uploadFileStream(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Save attachment details (fileUrl is either Cloudinary public_id or local relative path)
    const attachment = {
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.publicId, // Use publicId for Cloudinary URL signing
      fileType: req.file.mimetype,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    emrEntry.attachments.push(attachment);
    await emrEntry.save();

    // 3. Log audit event
    await auditService.logAuditEvent({
      userId: req.user.id,
      action: 'EMR_ATTACHMENT_UPLOAD',
      resource: 'EMR',
      resourceId: emrEntry._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      changes: {
        before: { attachmentsCount: emrEntry.attachments.length - 1 },
        after: { attachmentsCount: emrEntry.attachments.length, uploadedFile: attachment.fileName }
      }
    });

    // Generate response with signed URL
    const responseAttachment = {
      ...attachment,
      fileUrl: storageService.generateSignedUrl(uploadResult.publicId)
    };

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded and linked to EMR record successfully',
      data: responseAttachment
    });
  } catch (error) {
    logger.error(`Failed to handle attachment upload: ${error.message}`);
    return next(new AppError(`Attachment upload failed: ${error.message}`, 500));
  }
};

export default {
  createEMREntry,
  getEMRHistoryByPatient,
  uploadEMRAttachment
};
