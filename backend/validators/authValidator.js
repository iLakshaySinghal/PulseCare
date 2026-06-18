import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const registerStaffSchema = Joi.object({
  role: Joi.string().valid(
    'Hospital Admin',
    'Doctor',
    'Nurse',
    'Receptionist',
    'Lab Technician',
    'Pharmacist',
    'Billing Executive'
  ).required().messages({
    'any.only': 'Invalid staff role specified',
    'any.required': 'Role is required'
  }),
  email: Joi.string().trim().email().when('role', {
    is: 'Doctor',
    then: Joi.optional(),
    otherwise: Joi.required()
  }).messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).when('role', {
    is: 'Doctor',
    then: Joi.optional(),
    otherwise: Joi.required()
  }).messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().trim().max(50).required().messages({
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().trim().max(50).required().messages({
    'any.required': 'Last name is required'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  })
});

export default {
  loginSchema,
  registerStaffSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
