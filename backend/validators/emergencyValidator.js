import Joi from 'joi';

export const registerEmergencySchema = Joi.object({
  patientId: Joi.string().hex().length(24).allow('', null).optional(),
  anonymousPatientName: Joi.string().trim().max(100).allow('', null).optional(),
  chiefComplaint: Joi.string().trim().min(3).required(),
  vitals: Joi.object({
    bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).allow('', null).optional(),
    heartRate: Joi.number().integer().min(30).max(250).allow('', null).optional(),
    temperature: Joi.number().precision(1).min(90.0).max(110.0).allow('', null).optional()
  }).optional(),
  priority: Joi.string().valid('Critical', 'High', 'Medium', 'Low').required()
});

export const assignStaffSchema = Joi.object({
  assignedDoctorId: Joi.string().hex().length(24).allow('', null).optional(),
  assignedNurseId: Joi.string().hex().length(24).allow('', null).optional()
});

export const updateEmergencyTreatmentSchema = Joi.object({
  status: Joi.string().valid('Registered', 'Triage', 'Doctor Assigned', 'Under Treatment', 'Discharged', 'Admitted').required(),
  treatmentNotes: Joi.string().allow('', null).optional()
});

export default {
  registerEmergencySchema,
  assignStaffSchema,
  updateEmergencyTreatmentSchema
};
