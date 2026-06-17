import Joi from 'joi';

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const createPatientSchema = Joi.object({
  firstName: Joi.string().trim().max(50).required().messages({
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().trim().max(50).required().messages({
    'any.required': 'Last name is required'
  }),
  dateOfBirth: Joi.date().less('now').required().messages({
    'any.required': 'Date of birth is required',
    'date.less': 'Date of birth must be in the past'
  }),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say').required().messages({
    'any.only': 'Gender must be Male, Female, Other, or Prefer not to say',
    'any.required': 'Gender is required'
  }),
  contactNumber: Joi.string().pattern(phoneRegex).required().messages({
    'string.pattern.base': 'Contact number must be in E.164 international format (e.g. +1234567890)',
    'any.required': 'Contact number is required'
  }),
  email: Joi.string().trim().email().optional().messages({
    'string.email': 'Please provide a valid email address for portal association'
  }),
  password: Joi.string().min(8).optional().messages({
    'string.min': 'Password must be at least 8 characters long'
  }),
  emergencyContact: Joi.object({
    name: Joi.string().trim().required().messages({
      'any.required': 'Emergency contact name is required'
    }),
    relation: Joi.string().trim().required().messages({
      'any.required': 'Emergency contact relation is required'
    }),
    phone: Joi.string().pattern(phoneRegex).required().messages({
      'string.pattern.base': 'Emergency phone must be in E.164 international format'
    })
  }).required(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  allergies: Joi.array().items(Joi.string().trim()).optional()
});

export const updatePatientSchema = Joi.object({
  firstName: Joi.string().trim().max(50).optional(),
  lastName: Joi.string().trim().max(50).optional(),
  dateOfBirth: Joi.date().less('now').optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not to say').optional(),
  contactNumber: Joi.string().pattern(phoneRegex).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().trim().optional(),
    relation: Joi.string().trim().optional(),
    phone: Joi.string().pattern(phoneRegex).optional()
  }).optional(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  allergies: Joi.array().items(Joi.string().trim()).optional()
});

export default {
  createPatientSchema,
  updatePatientSchema
};
