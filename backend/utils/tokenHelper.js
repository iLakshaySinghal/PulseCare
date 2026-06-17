import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Signs a short-lived access JWT
 */
export const generateAccessToken = (user) => {
  const secret = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_key_9988776655';
  const expiry = process.env.ACCESS_TOKEN_EXPIRY || '15m';
  return jwt.sign(
    { userId: user._id, role: user.role },
    secret,
    { expiresIn: expiry }
  );
};

/**
 * Generates a cryptographically secure random refresh token string
 */
export const generateRawRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Hashes a token string using SHA-256 for secure database storage
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export default {
  generateAccessToken,
  generateRawRefreshToken,
  hashToken
};
