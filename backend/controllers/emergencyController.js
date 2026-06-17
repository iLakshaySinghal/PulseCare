import emergencyService from '../services/emergencyService.js';
import EmergencyCase from '../models/EmergencyCase.js';

export const registerEmergencyCase = async (req, res, next) => {
  try {
    const { patientId, anonymousPatientName, chiefComplaint, vitals, priority } = req.body;
    const userId = req.user.id;

    const emergencyCase = await emergencyService.registerEmergencyCase({
      patientId,
      anonymousPatientName,
      chiefComplaint,
      vitals,
      priority,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Emergency case registered successfully',
      data: emergencyCase
    });
  } catch (err) {
    next(err);
  }
};

export const assignStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedDoctorId, assignedNurseId } = req.body;
    const userId = req.user.id;

    const emergencyCase = await emergencyService.assignStaff(id, { assignedDoctorId, assignedNurseId }, userId);

    res.status(200).json({
      success: true,
      message: 'Emergency staff assignments updated',
      data: emergencyCase
    });
  } catch (err) {
    next(err);
  }
};

export const updateTreatment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, treatmentNotes } = req.body;
    const userId = req.user.id;

    const emergencyCase = await emergencyService.updateTreatment(id, { status, treatmentNotes }, userId);

    res.status(200).json({
      success: true,
      message: `Emergency case updated: Status changed to ${status}`,
      data: emergencyCase
    });
  } catch (err) {
    next(err);
  }
};

export const listEmergencyCases = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      // Default to active cases only
      filter.status = { $nin: ['Discharged', 'Admitted'] };
    }

    if (priority) {
      filter.priority = priority;
    }

    const cases = await EmergencyCase.find(filter)
      .populate('patientId', 'firstName lastName patientId contactNumber')
      .populate('assignedDoctorId', 'firstName lastName')
      .populate('assignedNurseId', 'firstName lastName')
      .sort({ priority: 1, registeredAt: 1 }); // Sort by priority, then chronological

    res.status(200).json({
      success: true,
      message: 'Emergency queue cases retrieved successfully',
      data: cases
    });
  } catch (err) {
    next(err);
  }
};

export const getEmergencyCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const emergencyCase = await EmergencyCase.findById(id)
      .populate('patientId')
      .populate('assignedDoctorId', 'firstName lastName')
      .populate('assignedNurseId', 'firstName lastName');

    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Emergency case not found' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Emergency case retrieved successfully',
      data: emergencyCase
    });
  } catch (err) {
    next(err);
  }
};

export default {
  registerEmergencyCase,
  assignStaff,
  updateTreatment,
  listEmergencyCases,
  getEmergencyCaseById
};
