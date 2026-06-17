import aiService from '../services/aiService.js';
import AILog from '../models/AILog.js';
import Patient from '../models/Patient.js';
import EMR from '../models/EMR.js';
import LabReport from '../models/LabReport.js';
import Consultation from '../models/Consultation.js';
import User from '../models/User.js';
import DoctorAvailability from '../models/DoctorAvailability.js';
import Invoice from '../models/Invoice.js';
import Appointment from '../models/Appointment.js';
import { NotFoundError, ValidationError } from '../utils/appError.js';

/**
 * POST /api/v1/ai/symptom-analyze
 */
export const analyzeSymptomsController = async (req, res, next) => {
  const { fever, headache, cough, chestPain, fatigue, additionalInfo } = req.body;

  const result = await aiService.analyzeSymptoms({
    fever: !!fever,
    headache: !!headache,
    cough: !!cough,
    chestPain: !!chestPain,
    fatigue: !!fatigue,
    additionalInfo
  });

  // Log usage
  await AILog.create({
    userId: req.user.id,
    featureName: 'Symptom Analyzer',
    promptText: JSON.stringify({ fever, headache, cough, chestPain, fatigue, additionalInfo }),
    responseText: JSON.stringify(result.data),
    tokenUsage: result.tokens,
    responseTimeMs: result.latency,
    status: 'Success'
  });

  res.status(200).json({
    success: true,
    data: result.data
  });
};

/**
 * POST /api/v1/ai/summarize-patient
 */
export const summarizePatientController = async (req, res, next) => {
  const { patientId } = req.body;

  if (!patientId) {
    return next(new ValidationError('patientId is required'));
  }

  // Fetch patient profile
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return next(new NotFoundError('Patient not found'));
  }

  // Gather medical contexts
  const emrs = await EMR.find({ patientId }).sort({ encounterDate: -1 }).limit(10);
  const labs = await LabReport.find({ patientId }).sort({ uploadedAt: -1 }).limit(5);
  const consultations = await Consultation.find({ patientId }).sort({ encounterDate: -1 }).limit(10);

  // Collate all prescriptions from EMR and Consultations
  const prescriptions = [];
  emrs.forEach(e => {
    if (e.prescriptions) prescriptions.push(...e.prescriptions);
  });
  consultations.forEach(c => {
    if (c.prescriptions) prescriptions.push(...c.prescriptions);
  });

  const result = await aiService.summarizePatientHistory(
    patient,
    emrs,
    labs,
    prescriptions,
    consultations
  );

  // Log usage
  await AILog.create({
    userId: req.user.id,
    featureName: 'Medical Record Summarizer',
    promptText: `patientId: ${patientId}`,
    responseText: JSON.stringify(result.data),
    tokenUsage: result.tokens,
    responseTimeMs: result.latency,
    status: 'Success'
  });

  res.status(200).json({
    success: true,
    data: result.data
  });
};

/**
 * POST /api/v1/ai/explain-prescription
 */
export const explainPrescriptionController = async (req, res, next) => {
  const { medicineName, patientQuery } = req.body;

  if (!medicineName) {
    return next(new ValidationError('medicineName is required'));
  }

  const result = await aiService.explainPrescription(medicineName, patientQuery);

  // Log usage
  await AILog.create({
    userId: req.user.id,
    featureName: 'Prescription Explainer',
    promptText: `Med: ${medicineName}, Q: ${patientQuery}`,
    responseText: JSON.stringify(result.data),
    tokenUsage: result.tokens,
    responseTimeMs: result.latency,
    status: 'Success'
  });

  res.status(200).json({
    success: true,
    data: result.data
  });
};

/**
 * POST /api/v1/ai/appointment-assist
 */
export const assistAppointmentController = async (req, res, next) => {
  const { queryText } = req.body;

  if (!queryText) {
    return next(new ValidationError('queryText is required'));
  }

  // Fetch doctors list
  const doctors = await User.find({ role: 'Doctor', isActive: true });
  
  // Fetch their availability slots
  const availabilities = await DoctorAvailability.find({
    doctorId: { $in: doctors.map(d => d._id) }
  });

  const result = await aiService.assistAppointment(queryText, doctors, availabilities);

  // Log usage
  await AILog.create({
    userId: req.user.id,
    featureName: 'Appointment Assistant',
    promptText: queryText,
    responseText: JSON.stringify(result.data),
    tokenUsage: result.tokens,
    responseTimeMs: result.latency,
    status: 'Success'
  });

  res.status(200).json({
    success: true,
    data: result.data
  });
};

/**
 * POST /api/v1/ai/operations-intelligence
 */
export const operationsIntelligenceController = async (req, res, next) => {
  const { queryText } = req.body;

  if (!queryText) {
    return next(new ValidationError('queryText is required'));
  }

  // Gather general metrics contexts
  const billingStats = await Invoice.aggregate([
    {
      $group: {
        _id: '$status',
        totalRevenue: { $sum: '$grandTotal' },
        count: { $sum: 1 }
      }
    }
  ]);

  const appointmentStats = await Appointment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const patientVolume = await Patient.countDocuments({});

  const result = await aiService.analyzeOperations(
    queryText,
    billingStats,
    appointmentStats,
    { patientVolume }
  );

  // Log usage
  await AILog.create({
    userId: req.user.id,
    featureName: 'Operations Intelligence',
    promptText: queryText,
    responseText: JSON.stringify(result.data),
    tokenUsage: result.tokens,
    responseTimeMs: result.latency,
    status: 'Success'
  });

  res.status(200).json({
    success: true,
    data: result.data
  });
};

export default {
  analyzeSymptomsController,
  summarizePatientController,
  explainPrescriptionController,
  assistAppointmentController,
  operationsIntelligenceController
};
