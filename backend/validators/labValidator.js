import Joi from 'joi';

export const createLabRequestSchema = Joi.object({
  patientId: Joi.string().hex().length(24).required(),
  testType: Joi.string().valid('Blood Test', 'X-Ray', 'MRI', 'CT Scan').required(),
  instructions: Joi.string().allow('', null).optional()
});

export const updateLabRequestStatusSchema = Joi.object({
  status: Joi.string().valid('Ordered', 'Received', 'Sample Collected', 'Testing', 'Completed', 'Cancelled').required(),
  sampleDetails: Joi.object({
    sampleType: Joi.string().required(),
    collectedAt: Joi.date().iso().optional()
  }).optional()
});

export const reviewReportSchema = Joi.object({
  reviewNotes: Joi.string().min(5).required()
});

export default {
  createLabRequestSchema,
  updateLabRequestStatusSchema,
  reviewReportSchema
};
