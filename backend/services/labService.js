import LabRequest from '../models/LabRequest.js';
import LabReport from '../models/LabReport.js';
import EMR from '../models/EMR.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import auditService from './auditService.js';
import notificationService from './notificationService.js';
import { NotFoundError, ConflictError } from '../utils/appError.js';
import { getIO } from '../config/socket.js';
import logger from '../config/logger.js';

/**
 * Creates a new Lab Test request ordered by a Doctor
 */
export const createLabRequest = async ({ patientId, doctorId, testType, instructions }) => {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new NotFoundError('Patient profile not found');
  }

  const request = await LabRequest.create({
    patientId,
    doctorId,
    testType,
    instructions,
    status: 'Ordered'
  });

  // Socket update to Techs and Doctors
  try {
    const io = getIO();
    io.to('role_Lab Technician').to(`user_${doctorId}`).emit('lab_request_updated', {
      action: 'ORDER',
      request
    });
  } catch (err) {
    logger.error(`Socket broadcast failed for lab request: ${err.message}`);
  }

  return request;
};

/**
 * Updates status of lab request (e.g. Received, Sample Collected, etc.)
 */
export const updateRequestStatus = async (requestId, status, sampleDetails, userId) => {
  const request = await LabRequest.findById(requestId).populate('patientId');
  if (!request) {
    throw new NotFoundError('Lab request not found');
  }

  request.status = status;
  if (sampleDetails) {
    request.sampleDetails = {
      sampleType: sampleDetails.sampleType,
      collectedAt: sampleDetails.collectedAt || new Date(),
      collectedBy: userId
    };
  }

  await request.save();

  // Socket notification
  try {
    const io = getIO();
    io.to('role_Lab Technician').to(`user_${request.doctorId}`).emit('lab_request_updated', {
      action: 'STATUS_CHANGE',
      request
    });
  } catch (err) {
    logger.error(`Socket broadcast failed on status change: ${err.message}`);
  }

  return request;
};

/**
 * Uploads a scan report and completes the lab request
 */
export const uploadLabReport = async ({ requestId, fileUrl, fileName, fileType, results, uploadedBy }) => {
  const request = await LabRequest.findById(requestId);
  if (!request) {
    throw new NotFoundError('Lab request not found');
  }

  if (request.status === 'Completed') {
    throw new ConflictError('This lab request is already completed');
  }

  // 1. Create Lab Report entry
  const report = await LabReport.create({
    labRequestId: requestId,
    patientId: request.patientId,
    testType: request.testType,
    fileUrl,
    fileName,
    fileType,
    results,
    uploadedBy
  });

  // 2. Mark request completed
  request.status = 'Completed';
  await request.save();

  // 3. Sync file attachment into patient's EMR record.
  // Find the latest EMR for this patient, otherwise create a new Lab EMR encounter.
  let emr = await EMR.findOne({ patientId: request.patientId }).sort({ encounterDate: -1 });
  if (!emr) {
    // Create new lab result encounter
    emr = await EMR.create({
      patientId: request.patientId,
      providerId: request.doctorId, // ordered by doctor
      encounterDate: new Date(),
      vitals: { bloodPressure: '120/80', heartRate: 72, temperature: 98.6 },
      clinicalNotes: `Lab test results attachment for test type: ${request.testType}`,
      diagnoses: []
    });
  }

  emr.attachments.push({
    fileName,
    fileUrl,
    fileType,
    uploadedBy,
    uploadedAt: new Date()
  });
  await emr.save();

  // 4. Audit Log
  await auditService.logAuditEvent({
    userId: uploadedBy,
    action: 'LAB_REPORT_UPLOAD',
    resource: 'LabReport',
    resourceId: report._id,
    changes: { before: null, after: report.toObject() }
  });

  // 5. Socket Notification
  try {
    const io = getIO();
    io.to(`user_${request.doctorId}`).emit('lab_report_uploaded', {
      requestId,
      report,
      patientId: request.patientId
    });
  } catch (err) {
    logger.error(`Socket broadcast failed for report upload: ${err.message}`);
  }

  return report;
};

/**
 * Doctor reviews report and files notes
 */
export const reviewLabReport = async (reportId, reviewNotes, doctorId) => {
  const report = await LabReport.findById(reportId).populate('patientId');
  if (!report) {
    throw new NotFoundError('Lab report not found');
  }

  const beforeState = report.toObject();

  report.reviewedBy = doctorId;
  report.reviewedAt = new Date();
  report.reviewNotes = reviewNotes;

  await report.save();

  // Audit Log
  await auditService.logAuditEvent({
    userId: doctorId,
    action: 'LAB_REPORT_REVIEW',
    resource: 'LabReport',
    resourceId: report._id,
    changes: { before: beforeState, after: report.toObject() }
  });

  // Notify Patient that their test result is reviewed
  const patient = report.patientId;
  if (patient && patient.userId) {
    const patientUser = await User.findById(patient.userId);
    if (patientUser) {
      const emailTemplate = `
        <h3>Your Lab Test Report Has Been Reviewed</h3>
        <p>Dear ${patient.firstName},</p>
        <p>Your doctor has reviewed the results of your ${report.testType}.</p>
        <p>Review Notes: ${reviewNotes}</p>
      `;
      try {
        await notificationService.dispatchNotification({
          recipientId: patientUser._id,
          emailAddress: patientUser.email,
          subject: 'Lab Test Results Reviewed - HMS',
          htmlTemplate: emailTemplate,
          context: {}
        });
      } catch (err) {
        logger.error(`Email fail on review notification: ${err.message}`);
      }
    }
  }

  return report;
};

export default {
  createLabRequest,
  updateRequestStatus,
  uploadLabReport,
  reviewLabReport
};
