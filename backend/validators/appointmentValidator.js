import Joi from 'joi';

export const createAppointmentSchema = Joi.object({
  patientId: Joi.string().hex().length(24).required(),
  doctorId: Joi.string().hex().length(24).required(),
  appointmentDate: Joi.date().iso().required(),
  slot: Joi.object({
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).message('startTime must be in HH:MM format').required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).message('endTime must be in HH:MM format').required()
  }).required(),
  reason: Joi.string().max(500).allow('', null).optional()
});

export const updateAppointmentStatusSchema = Joi.object({
  status: Joi.string().valid('Requested', 'Confirmed', 'In Consultation', 'Completed', 'Cancelled').required(),
  cancellationReason: Joi.string().max(300).allow('', null).optional()
});

export const doctorAvailabilitySchema = Joi.object({
  dayOfWeek: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
  slots: Joi.array().items(Joi.object({
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).message('startTime must be HH:MM').required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).message('endTime must be HH:MM').required()
  })).min(1).required()
});

export default {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  doctorAvailabilitySchema
};
