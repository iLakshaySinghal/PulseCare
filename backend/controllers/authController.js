import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateAccessToken, generateRawRefreshToken, hashToken } from '../utils/tokenHelper.js';
import auditService from '../services/auditService.js';
import notificationService from '../services/notificationService.js';
import { AppError, UnauthorizedError, ForbiddenError, ConflictError, NotFoundError } from '../utils/appError.js';
import logger from '../config/logger.js';

/**
 * Helper to set refresh token in cookie
 */
const setRefreshCookie = (res, token) => {
  const cookieExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: cookieExpiry
  });
};

/**
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    return next(new UnauthorizedError('Invalid credentials or inactive account'));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new UnauthorizedError('Invalid credentials'));
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = generateRawRefreshToken();
  const hashedRefreshToken = hashToken(rawRefreshToken);

  // Store hashed refresh token in DB
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create({
    userId: user._id,
    token: hashedRefreshToken,
    expiresAt
  });

  // Set cookie
  setRefreshCookie(res, rawRefreshToken);

  // Log audit event
  await auditService.logAuditEvent({
    userId: user._id,
    action: 'USER_LOGIN',
    resource: 'User',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    data: {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  });
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  const rawToken = req.cookies?.refreshToken;

  if (rawToken) {
    const hashed = hashToken(rawToken);
    const dbToken = await RefreshToken.findOne({ token: hashed });
    if (dbToken) {
      // Remove token from database
      await dbToken.deleteOne();
      
      // Log logout event
      await auditService.logAuditEvent({
        userId: dbToken.userId,
        action: 'USER_LOGOUT',
        resource: 'User',
        resourceId: dbToken.userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
  }

  res.clearCookie('refreshToken', {
    path: '/api/v1/auth',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req, res, next) => {
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) {
    return next(new UnauthorizedError('Refresh token cookie is missing'));
  }

  const hashed = hashToken(rawToken);
  const dbToken = await RefreshToken.findOne({ token: hashed });

  // 1. Replay attack detection
  if (!dbToken) {
    // If raw token exists but is not found in database, check if it was previously rotated
    // Since we hash it, a user sending a token that was deleted or doesn't match will trigger this.
    // In strict rotation, we want to warn about potential tampering
    return next(new UnauthorizedError('Invalid or expired refresh session'));
  }

  if (dbToken.isRevoked) {
    // SECURITY ALARM: Token has been reused! 
    // Delete all active refresh tokens for this user ID to log them out everywhere.
    const userId = dbToken.userId;
    await RefreshToken.deleteMany({ userId });

    await auditService.logAuditEvent({
      userId,
      action: 'SECURITY_ALERT_REFRESH_TOKEN_REPLAY',
      resource: 'User',
      resourceId: userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      changes: {
        before: { isRevoked: true },
        after: { allSessionsCleared: true }
      }
    });

    res.clearCookie('refreshToken', {
      path: '/api/v1/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return next(new ForbiddenError('Security violation: Refresh token reuse detected. All active sessions revoked.'));
  }

  // 2. Fetch User and verify they are still active
  const user = await User.findById(dbToken.userId);
  if (!user || !user.isActive) {
    return next(new UnauthorizedError('User account associated with this token is inactive or deleted'));
  }

  // 3. Perform rotation (RTR)
  const newRawRefreshToken = generateRawRefreshToken();
  const newHashed = hashToken(newRawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create new refresh token entry
  const newDbToken = await RefreshToken.create({
    userId: user._id,
    token: newHashed,
    expiresAt
  });

  // Mark old token as revoked and record trace link
  dbToken.isRevoked = true;
  dbToken.replacedByToken = String(newDbToken._id);
  await dbToken.save();

  // Send new token via cookie
  setRefreshCookie(res, newRawRefreshToken);

  // Generate new Access JWT
  const accessToken = generateAccessToken(user);

  res.status(200).json({
    success: true,
    message: 'Tokens rotated successfully',
    data: {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  });
};

/**
 * POST /api/v1/auth/register-staff
 */
export const registerStaff = async (req, res, next) => {
  let { email, password, firstName, lastName, role } = req.body;

  const autoGenRoles = {
    'Doctor': 'dr',
    'Nurse': 'nr',
    'Receptionist': 'rc',
    'Lab Technician': 'lt',
    'Pharmacist': 'ph',
    'Billing Executive': 'bl'
  };

  const isAutoGen = role in autoGenRoles;
  if (isAutoGen) {
    const cleanFirstName = firstName.trim().toLowerCase().replace(/\s+/g, '');
    const cleanLastName = lastName.trim().toLowerCase().replace(/\s+/g, '');
    const domainSuffix = autoGenRoles[role];
    email = `${cleanFirstName}.${cleanLastName}@${domainSuffix}.pulsecare.com`;
    password = `${cleanFirstName}1234`;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ConflictError('A user with this email address already exists'));
  }

  const newStaff = await User.create({
    email,
    passwordHash: password, // pre-save hashes it
    firstName,
    lastName,
    role
  });

  // Log audit trail
  await auditService.logAuditEvent({
    userId: req.user.id, // Who registered this staff (Admin)
    action: 'STAFF_REGISTRATION',
    resource: 'User',
    resourceId: newStaff._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    changes: {
      before: null,
      after: { email: newStaff.email, role: newStaff.role, name: `${firstName} ${lastName}` }
    }
  });

  // Send welcome email asynchronously
  try {
    const templatePath = path.join(process.cwd(), 'templates', 'registrationEmail.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    await notificationService.dispatchNotification({
      recipientId: newStaff._id,
      emailAddress: newStaff.email,
      subject: 'Welcome to HMS - Account Created',
      htmlTemplate: templateContent,
      context: {
        firstName,
        lastName,
        email,
        role
      }
    });
  } catch (err) {
    logger.error(`Welcome email dispatch failed for ${email}: ${err.message}`);
  }

  let successMessage = 'Staff account registered successfully';
  if (isAutoGen) {
    successMessage = `${role} registered successfully. Email: ${email}, Password: ${password}`;
  }

  res.status(201).json({
    success: true,
    message: successMessage,
    data: {
      id: newStaff._id,
      email: newStaff.email,
      firstName: newStaff.firstName,
      lastName: newStaff.lastName,
      role: newStaff.role,
      createdAt: newStaff.createdAt
    }
  });
};

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Sanitize message: return success response even if user doesn't exist 
  // to avoid user enumeration vulnerability.
  if (!user || !user.isActive) {
    return res.status(200).json({
      success: true,
      message: 'If the email is registered, a password reset link has been sent.'
    });
  }

  // Generate reset token valid for 1 hour
  const token = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send email
  try {
    const origin = process.env.ALLOWED_CLIENT_ORIGIN || 'http://localhost:5173';
    const resetUrl = `${origin}/reset-password?token=${token}`;
    
    const templatePath = path.join(process.cwd(), 'templates', 'resetPasswordEmail.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    await notificationService.dispatchNotification({
      recipientId: user._id,
      emailAddress: user.email,
      subject: 'HMS Portal Password Reset Link',
      htmlTemplate: templateContent,
      context: { resetUrl }
    });
  } catch (err) {
    logger.error(`Forgot password email failed for ${email}: ${err.message}`);
  }

  res.status(200).json({
    success: true,
    message: 'If the email is registered, a password reset link has been sent.'
  });
};

/**
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new UnauthorizedError('Password reset token is invalid or has expired'));
  }

  user.passwordHash = password; // pre-save hook will hash it
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Audit trail logging
  await auditService.logAuditEvent({
    userId: user._id,
    action: 'PASSWORD_RESET',
    resource: 'User',
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully. You can now log in.'
  });
};

/**
 * POST /api/v1/auth/register-patient
 * Public self-registration for patients
 */
export const registerPatient = async (req, res, next) => {
  const {
    email,
    password,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    contactNumber,
    emergencyContact,
    bloodGroup,
    allergies
  } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required for registration', 400, 'BAD_REQUEST'));
  }

  // 1. Verify user email uniqueness
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ConflictError('An account with this email address already exists.'));
  }

  // 2. Create User account (role: Patient)
  const patientUser = await User.create({
    email,
    passwordHash: password, // pre-save hashes it
    firstName,
    lastName,
    role: 'Patient',
    isActive: true
  });

  // 3. Generate Custom unique Patient ID
  const patientId = await import('../utils/patientIdGenerator.js').then((m) => m.generatePatientId());

  // 4. Create Demographic sheet
  const newPatient = await Patient.create({
    patientId,
    userId: patientUser._id,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    contactNumber,
    emergencyContact,
    bloodGroup,
    allergies
  });

  // 5. Log audit event
  await auditService.logAuditEvent({
    userId: patientUser._id, // patient registers themselves
    action: 'PATIENT_SELF_REGISTRATION',
    resource: 'Patient',
    resourceId: newPatient._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    changes: {
      before: null,
      after: {
        patientId,
        name: `${firstName} ${lastName}`,
        userId: patientUser._id
      }
    }
  });

  // 6. Send welcome email asynchronously
  try {
    const templatePath = path.join(process.cwd(), 'templates', 'registrationEmail.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    await notificationService.dispatchNotification({
      recipientId: patientUser._id,
      emailAddress: patientUser.email,
      subject: 'Welcome to Pulsecare - Account Created',
      htmlTemplate: templateContent,
      context: {
        firstName,
        lastName,
        email,
        role: 'Patient'
      }
    });
  } catch (err) {
    logger.error(`Welcome email dispatch failed for ${email}: ${err.message}`);
  }

  res.status(201).json({
    success: true,
    message: 'Patient account and profile registered successfully',
    data: {
      userId: patientUser._id,
      patientId: newPatient.patientId,
      email: patientUser.email,
      firstName: patientUser.firstName,
      lastName: patientUser.lastName
    }
  });
};

export default {
  login,
  logout,
  refresh,
  registerStaff,
  forgotPassword,
  resetPassword,
  registerPatient
};
