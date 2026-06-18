import express from 'express';
import {
  login,
  logout,
  refresh,
  registerStaff,
  forgotPassword,
  resetPassword,
  registerPatient
} from '../controllers/authController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validateRequest } from '../middlewares/requestValidator.js';
import {
  loginSchema,
  registerStaffSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/authValidator.js';
import { createPatientSchema } from '../validators/patientValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting on sensitive login and password reset routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 10000, // Max 10 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again in 15 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', authRateLimiter, validateRequest(loginSchema), asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.post('/refresh', asyncHandler(refresh));
router.post('/register-patient', authRateLimiter, validateRequest(createPatientSchema), asyncHandler(registerPatient));

router.post(
  '/register-staff',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Hospital Admin'),
  validateRequest(registerStaffSchema),
  asyncHandler(registerStaff)
);

router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), asyncHandler(resetPassword));

export default router;
