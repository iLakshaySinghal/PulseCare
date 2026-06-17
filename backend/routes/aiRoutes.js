import express from 'express';
import {
  analyzeSymptomsController,
  summarizePatientController,
  explainPrescriptionController,
  assistAppointmentController,
  operationsIntelligenceController
} from '../controllers/aiController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authenticateJWT);

router.post(
  '/symptom-analyze',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient'),
  asyncHandler(analyzeSymptomsController)
);

router.post(
  '/summarize-patient',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Doctor', 'Nurse'),
  asyncHandler(summarizePatientController)
);

router.post(
  '/explain-prescription',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Pharmacist', 'Patient'),
  asyncHandler(explainPrescriptionController)
);

router.post(
  '/appointment-assist',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient'),
  asyncHandler(assistAppointmentController)
);

router.post(
  '/operations-intelligence',
  authorizeRoles('Super Admin', 'Hospital Admin'),
  asyncHandler(operationsIntelligenceController)
);

export default router;
