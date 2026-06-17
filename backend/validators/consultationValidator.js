import Joi from 'joi';

export const createConsultationSchema = Joi.object({
  appointmentId: Joi.string().hex().length(24).required(),
  vitals: Joi.object({
    bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).message('Blood pressure must follow format SBP/DBP (e.g. 120/80)').required(),
    heartRate: Joi.number().integer().min(30).max(250).required(),
    temperature: Joi.number().precision(1).min(90.0).max(110.0).required()
  }).optional(),
  clinicalNotes: Joi.string().min(5).required(),
  diagnoses: Joi.array().items(Joi.object({
    code: Joi.string().pattern(/^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/).message('ICD-10 code format is invalid (e.g. A01 or J06.9)').required(),
    name: Joi.string().required(),
    status: Joi.string().valid('Active', 'Resolved', 'Suspected').required()
  })).required(),
  prescriptions: Joi.array().items(Joi.object({
    drugName: Joi.string().required(),
    dosage: Joi.string().required(),
    frequency: Joi.string().required(),
    duration: Joi.string().required()
  })).optional(),
  treatmentPlan: Joi.object({
    goal: Joi.string().allow('', null).optional(),
    instructions: Joi.string().allow('', null).optional()
  }).optional()
});

export default {
  createConsultationSchema
};
