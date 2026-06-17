import Joi from 'joi';

const bpRegex = /^\d{2,3}\/\d{2,3}$/;
const icd10Regex = /^[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?$/;

export const createEMREntrySchema = Joi.object({
  patientId: Joi.string().hex().length(24).required().messages({
    'string.length': 'Patient ObjectId must be a valid 24-char hex string',
    'any.required': 'Patient ID is required'
  }),
  clinicalNotes: Joi.string().min(10).required().messages({
    'string.min': 'Clinical notes must be at least 10 characters long',
    'any.required': 'Clinical notes are required'
  }),
  vitals: Joi.object({
    bloodPressure: Joi.string().pattern(bpRegex).required().messages({
      'string.pattern.base': 'Blood pressure must be formatted as SBP/DBP (e.g. 120/80)',
      'any.required': 'Blood pressure is required'
    }),
    heartRate: Joi.number().integer().min(30).max(250).required().messages({
      'number.min': 'Heart rate must be at least 30 bpm',
      'number.max': 'Heart rate cannot exceed 250 bpm',
      'any.required': 'Heart rate is required'
    }),
    temperature: Joi.number().precision(1).min(90.0).max(110.0).required().messages({
      'number.min': 'Temperature must be at least 90°F',
      'number.max': 'Temperature cannot exceed 110°F',
      'any.required': 'Temperature is required'
    })
  }).required(),
  diagnoses: Joi.array().items(
    Joi.object({
      code: Joi.string().pattern(icd10Regex).required().messages({
        'string.pattern.base': 'Diagnosis code must follow ICD-10 code format (e.g. J06.9)'
      }),
      name: Joi.string().trim().required().messages({
        'any.required': 'Diagnosis name is required'
      }),
      status: Joi.string().valid('Active', 'Resolved', 'Suspected').required().messages({
        'any.only': 'Diagnosis status must be Active, Resolved, or Suspected'
      })
    })
  ).required().messages({
    'any.required': 'At least one diagnosis is required'
  }),
  prescriptions: Joi.array().items(
    Joi.object({
      drugName: Joi.string().trim().required().messages({
        'any.required': 'Medication name is required'
      }),
      dosage: Joi.string().trim().required().messages({
        'any.required': 'Medication dosage is required'
      }),
      frequency: Joi.string().trim().required().messages({
        'any.required': 'Frequency (e.g. Twice Daily) is required'
      }),
      duration: Joi.string().trim().required().messages({
        'any.required': 'Duration (e.g. 7 days) is required'
      })
    })
  ).optional()
});

export default {
  createEMREntrySchema
};
