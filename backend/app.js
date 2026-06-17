import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import rateLimit from 'express-rate-limit';

import { cookieParser } from './middlewares/cookieParser.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { NotFoundError } from './utils/appError.js';

import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import emrRoutes from './routes/emrRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import labRoutes from './routes/labRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

// 1. Core Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigin = process.env.ALLOWED_CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 2. Global Rate Limiting (100 requests per 15 minutes per IP)
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 10000,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP. Please try again after 15 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalRateLimiter);

// 3. Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser);

// 4. Serve uploads folder statically for development disk fallback
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// 5. Mount API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/emr', emrRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/lab', labRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/admissions', admissionRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date()
  });
});

// 6. Catch-all for undefined routes
app.use('*', (req, res, next) => {
  next(new NotFoundError(`Requested endpoint '${req.originalUrl}' does not exist`));
});

// 7. Centralized Global Error Handler
app.use(errorHandler);

export default app;
export { app };
