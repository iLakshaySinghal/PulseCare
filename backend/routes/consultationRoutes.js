import express from 'express';
import {
  startConsultation,
  updateConsultation,
  completeConsultation,
  getConsultationById,
  getPatientConsultations
} from '../controllers/consultationController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validateRequest } from '../middlewares/requestValidator.js';
import { createConsultationSchema } from '../validators/consultationValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authenticateJWT);

router.post(
  '/',
  authorizeRoles('Doctor'),
  asyncHandler(startConsultation)
);

router.put(
  '/:id',
  authorizeRoles('Doctor'),
  validateRequest(createConsultationSchema),
  asyncHandler(updateConsultation)
);

router.post(
  '/:id/complete',
  authorizeRoles('Doctor'),
  asyncHandler(completeConsultation)
);

router.get(
  '/:id',
  authorizeRoles('Doctor', 'Nurse', 'Patient', 'Hospital Admin', 'Super Admin'),
  asyncHandler(getConsultationById)
);

router.get(
  '/patient/:patientId',
  authorizeRoles('Doctor', 'Nurse', 'Patient', 'Hospital Admin', 'Super Admin'),
  asyncHandler(getPatientConsultations)
);

export default router;
