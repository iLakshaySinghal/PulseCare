import EmergencyCase from '../models/EmergencyCase.js';
import User from '../models/User.js';
import auditService from './auditService.js';
import { NotFoundError, ConflictError } from '../utils/appError.js';
import { getIO } from '../config/socket.js';
import logger from '../config/logger.js';

/**
 * Generates a unique emergency case number (ER-YYYYMMDD-XXXX)
 */
const generateCaseNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  let caseNumber;
  let exists = true;

  while (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    caseNumber = `ER-${dateStr}-${randomSuffix}`;
    const match = await EmergencyCase.findOne({ caseNumber });
    if (!match) exists = false;
  }
  return caseNumber;
};

/**
 * Registers a new emergency case and triages it
 */
export const registerEmergencyCase = async ({ patientId, anonymousPatientName, chiefComplaint, vitals, priority, userId }) => {
  const caseNumber = await generateCaseNumber();

  const emergencyCase = await EmergencyCase.create({
    caseNumber,
    patientId: patientId || null,
    anonymousPatientName: anonymousPatientName || '',
    triageDetails: {
      chiefComplaint,
      vitals: vitals || {}
    },
    priority,
    status: 'Registered'
  });

  // Log Audit
  await auditService.logAuditEvent({
    userId,
    action: 'EMERGENCY_REGISTER',
    resource: 'EmergencyCase',
    resourceId: emergencyCase._id,
    changes: { before: null, after: emergencyCase.toObject() }
  });

  // Socket notification
  try {
    const io = getIO();
    io.to('emergency_room').to('role_Doctor').to('role_Nurse').emit('emergency_queue_updated', {
      action: 'REGISTER',
      emergencyCase
    });
  } catch (err) {
    logger.error(`Socket broadcast fail in registerEmergencyCase: ${err.message}`);
  }

  return emergencyCase;
};

/**
 * Assigns staff (Doctor and/or Nurse) to an emergency case
 */
export const assignStaff = async (caseId, { assignedDoctorId, assignedNurseId }, userId) => {
  const emergencyCase = await EmergencyCase.findById(caseId);
  if (!emergencyCase) {
    throw new NotFoundError('Emergency case not found');
  }

  const beforeState = emergencyCase.toObject();

  if (assignedDoctorId) {
    const doctor = await User.findOne({ _id: assignedDoctorId, role: 'Doctor' });
    if (!doctor) throw new NotFoundError('Doctor not found');
    emergencyCase.assignedDoctorId = assignedDoctorId;
    emergencyCase.status = 'Doctor Assigned';
  }

  if (assignedNurseId) {
    const nurse = await User.findOne({ _id: assignedNurseId, role: 'Nurse' });
    if (!nurse) throw new NotFoundError('Nurse not found');
    emergencyCase.assignedNurseId = assignedNurseId;
  }

  await emergencyCase.save();

  // Audit Log
  await auditService.logAuditEvent({
    userId,
    action: 'EMERGENCY_ASSIGN_STAFF',
    resource: 'EmergencyCase',
    resourceId: emergencyCase._id,
    changes: { before: beforeState, after: emergencyCase.toObject() }
  });

  // Socket event
  try {
    const io = getIO();
    io.to('emergency_room').to('role_Doctor').to('role_Nurse').emit('emergency_queue_updated', {
      action: 'ASSIGN_STAFF',
      emergencyCase
    });
  } catch (err) {
    logger.error(`Socket broadcast fail in assignStaff: ${err.message}`);
  }

  return emergencyCase;
};

/**
 * Updates status or treatment details of the emergency case
 */
export const updateTreatment = async (caseId, { status, treatmentNotes }, userId) => {
  const emergencyCase = await EmergencyCase.findById(caseId);
  if (!emergencyCase) {
    throw new NotFoundError('Emergency case not found');
  }

  const beforeState = emergencyCase.toObject();

  emergencyCase.status = status;
  if (treatmentNotes) {
    emergencyCase.treatmentNotes = treatmentNotes;
  }

  if (status === 'Discharged' || status === 'Admitted') {
    emergencyCase.dischargedAt = new Date();
  }

  await emergencyCase.save();

  // Audit Log
  await auditService.logAuditEvent({
    userId,
    action: `EMERGENCY_STATUS_${status.toUpperCase()}`,
    resource: 'EmergencyCase',
    resourceId: emergencyCase._id,
    changes: { before: beforeState, after: emergencyCase.toObject() }
  });

  // Socket event
  try {
    const io = getIO();
    io.to('emergency_room').to('role_Doctor').to('role_Nurse').emit('emergency_queue_updated', {
      action: 'TREATMENT_UPDATE',
      emergencyCase
    });
  } catch (err) {
    logger.error(`Socket broadcast fail in updateTreatment: ${err.message}`);
  }

  return emergencyCase;
};

export default {
  registerEmergencyCase,
  assignStaff,
  updateTreatment
};
