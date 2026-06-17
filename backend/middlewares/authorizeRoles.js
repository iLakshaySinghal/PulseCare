import { ForbiddenError } from '../utils/appError.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied: Your role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

export default authorizeRoles;
