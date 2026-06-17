import express from 'express';
import multer from 'multer';
import {
  createEMREntry,
  getEMRHistoryByPatient,
  uploadEMRAttachment
} from '../controllers/emrController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validateRequest } from '../middlewares/requestValidator.js';
import { createEMREntrySchema } from '../validators/emrValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/appError.js';

const router = express.Router();

// Configure Multer for secure memory buffer parsing
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
    fileSize: 10 * 1024 * 1024 // 10MB file limit
  }
});

// Apply JWT authentication on all EMR routes
router.use(authenticateJWT);

router.post(
  '/',
  authorizeRoles('Doctor', 'Nurse'),
  validateRequest(createEMREntrySchema),
  asyncHandler(createEMREntry)
);

router.get(
  '/patient/:patientId',
  authorizeRoles('Hospital Admin', 'Doctor', 'Nurse', 'Pharmacist', 'Patient'),
  asyncHandler(getEMRHistoryByPatient)
);

router.post(
  '/:id/attachments',
  authorizeRoles('Doctor', 'Nurse', 'Lab Technician'),
  (req, res, next) => {
    // Multer error handling wrapper
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
  asyncHandler(uploadEMRAttachment)
);

export default router;
