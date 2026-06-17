import logger from '../config/logger.js';
import AppError from '../utils/appError.js';

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.code = err.code || 'INTERNAL_ERROR';

  // Log error
  logger.error({
    message: `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    stack: err.stack,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  const response = {
    success: false,
    error: {
      code: err.code,
      message: err.isOperational || !isProduction ? err.message : 'An unexpected error occurred on the server.',
      ...(err.details && err.details.length > 0 && { details: err.details }),
      ...(!isProduction && { stack: err.stack })
    }
  };

  res.status(err.statusCode).json(response);
};

export default errorHandler;
