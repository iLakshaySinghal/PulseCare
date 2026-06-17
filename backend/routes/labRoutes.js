import express from 'express';
import multer from 'multer';
import {
  createLabRequest,
  listLabRequests,
  updateLabRequestStatus,
  uploadReport,
  reviewReport,
  getLabReport
} from '../controllers/labController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validateRequest } from '../middlewares/requestValidator.js';
import {
  createLabRequestSchema,
  updateLabRequestStatusSchema,
  reviewReportSchema
} from '../validators/labValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

const router = express.Router();

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF, JPEG, and PNG are allowed.', 400, 'LIMIT_UNSUPPORTED_FILE'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.use(authenticateJWT);

router.post(
  '/requests',
  authorizeRoles('Doctor'),
  validateRequest(createLabRequestSchema),
  asyncHandler(createLabRequest)
);

router.get(
  '/requests',
  authorizeRoles('Doctor', 'Nurse', 'Lab Technician', 'Patient', 'Hospital Admin', 'Super Admin'),
  asyncHandler(listLabRequests)
);

router.put(
  '/requests/:id/status',
  authorizeRoles('Lab Technician', 'Doctor'),
  validateRequest(updateLabRequestStatusSchema),
  asyncHandler(updateLabRequestStatus)
);

router.post(
  '/requests/:id/report',
  authorizeRoles('Lab Technician'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File size limit exceeded. Maximum file size is 10MB.', 400, 'LIMIT_FILE_SIZE'));
        }
        return next(new AppError(err.message, 400, 'MULTER_ERROR'));
      } else if (err) {
        return next(err);
      }
      next();
    });
  },
  asyncHandler(uploadReport)
);

router.put(
  '/reports/:id/review',
  authorizeRoles('Doctor'),
  validateRequest(reviewReportSchema),
  asyncHandler(reviewReport)
);

router.get(
  '/reports/:id',
  authorizeRoles('Doctor', 'Nurse', 'Lab Technician', 'Patient', 'Hospital Admin', 'Super Admin'),
  asyncHandler(getLabReport)
);

export default router;
