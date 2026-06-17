import { ValidationError } from '../utils/appError.js';

export const validateRequest = (schema, type = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[type], {
      abortEarly: false,
      stripUnknown: true, // strip fields not in schema
      allowUnknown: false
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return next(new ValidationError('Validation failed', details));
    }

    // Replace original object with the sanitized and converted Joi value
    req[type] = value;
    next();
  };
};

export default validateRequest;
