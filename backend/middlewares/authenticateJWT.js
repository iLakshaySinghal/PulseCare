import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/appError.js';

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token is missing or malformed'));
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_key_9988776655';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new UnauthorizedError('Access token has expired'));
      }
      return next(new UnauthorizedError('Invalid access token'));
    }

    // Attach user information to request
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };

    next();
  });
};

export default authenticateJWT;
