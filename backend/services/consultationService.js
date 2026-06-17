import Consultation from '../models/Consultation.js';
import Appointment from '../models/Appointment.js';
import EMR from '../models/EMR.js';
import Patient from '../models/Patient.js';
import auditService from './auditService.js';
import { NotFoundError, ConflictError } from '../utils/appError.js';
import { getIO } from '../config/socket.js';
import logger from '../config/logger.js';

/**
 * Initializes or fetches an active consultation
 */
export const startConsultation = async (appointmentId, doctorId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  if (String(appointment.doctorId) !== String(doctorId)) {
    throw new ConflictError('This appointment is assigned to a different doctor');
  }

  // Check if consultation already exists
  let consultation = await Consultation.findOne({ appointmentId });
  if (!consultation) {
    // If not, create an in-progress consultation
    consultation = await Consultation.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId,
      status: 'In Progress',
      vitals: {
        bloodPressure: '120/80', // default placeholders to be filled
        heartRate: 72,
        temperature: 98.6
      }
    });

    // Update appointment status to 'In Consultation'
    appointment.status = 'In Consultation';
    await appointment.save();

    // Broadcast appointment update
    try {
      const io = getIO();
      io.to('role_Receptionist').emit('appointment_updated', {
        action: 'IN_CONSULTATION',
        appointment
      });
    } catch (err) {
      logger.error(`Socket fail starting consultation: ${err.message}`);
    }
  }

  return consultation;
};

/**
 * Updates draft consultation workspace details
 */
export const updateConsultationDraft = async (consultationId, doctorId, data) => {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new NotFoundError('Consultation sheet not found');
  }

  if (String(consultation.doctorId) !== String(doctorId)) {
    throw new ConflictError('Unauthorized: You are not the assigned doctor for this sheet');
  }

  if (consultation.status === 'Completed') {
    throw new ConflictError('Cannot update draft. Consultation already completed.');
  }

  // Allow modifying vitals, notes, diagnoses, prescriptions, treatmentPlan
  if (data.vitals) consultation.vitals = data.vitals;
  if (data.clinicalNotes) consultation.clinicalNotes = data.clinicalNotes;
  if (data.diagnoses) consultation.diagnoses = data.diagnoses;
  if (data.prescriptions) consultation.prescriptions = data.prescriptions;
  if (data.treatmentPlan) consultation.treatmentPlan = data.treatmentPlan;

  await consultation.save();
  return consultation;
};

/**
 * Finalizes the consultation: publishes to EMR, updates appointment status
 */
export const completeConsultation = async (consultationId, doctorId) => {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new NotFoundError('Consultation workspace not found');
  }

  if (String(consultation.doctorId) !== String(doctorId)) {
    throw new ConflictError('Unauthorized: You are not the assigned doctor');
  }

  if (consultation.status === 'Completed') {
    throw new ConflictError('Consultation is already completed');
  }

  // 1. Double check patient exists
  const patient = await Patient.findById(consultation.patientId);
  if (!patient) {
    throw new NotFoundError('Patient profile not found');
  }

  // 2. Add clinical record directly to EMR collection (Member 1 format)
  const newEmrRecord = await EMR.create({
    patientId: consultation.patientId,
    providerId: doctorId,
    encounterDate: new Date(),
    vitals: {
      bloodPressure: consultation.vitals.bloodPressure || '120/80',
      heartRate: consultation.vitals.heartRate || 72,
      temperature: consultation.vitals.temperature || 98.6
    },
    clinicalNotes: consultation.clinicalNotes || 'Consultation completed.',
    diagnoses: consultation.diagnoses.map((d) => ({
      code: d.code,
      name: d.name,
      status: d.status
    })),
    prescriptions: consultation.prescriptions.map((p) => ({
      drugName: p.drugName,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration
    }))
  });

  // 3. Mark Consultation sheet completed
  consultation.status = 'Completed';
  consultation.emrId = newEmrRecord._id;
  await consultation.save();

  // 4. Mark Appointment completed
  const appointment = await Appointment.findById(consultation.appointmentId);
  if (appointment) {
    appointment.status = 'Completed';
    await appointment.save();
  }

  // 5. Audit Logging
  await auditService.logAuditEvent({
    userId: doctorId,
    action: 'EMR_CREATE_CONSULTATION',
    resource: 'EMR',
    resourceId: newEmrRecord._id,
    changes: { before: null, after: newEmrRecord.toObject() }
  });

  // 6. Broadcast Real-time Events
  try {
    const io = getIO();
    // Broadcast for Receptionists (appointment complete)
    io.to('role_Receptionist').emit('appointment_updated', {
      action: 'COMPLETE',
      appointment
    });

    // Broadcast for Pharmacists (new prescription queue alert)
    if (consultation.prescriptions && consultation.prescriptions.length > 0) {
      io.to('role_Pharmacist').emit('new_prescription_available', {
        emrId: newEmrRecord._id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        prescriptions: consultation.prescriptions
      });
    }
  } catch (err) {
    logger.error(`Socket broadcast fail in completeConsultation: ${err.message}`);
  }

  return consultation;
};

export default {
  startConsultation,
  updateConsultationDraft,
  completeConsultation
};
