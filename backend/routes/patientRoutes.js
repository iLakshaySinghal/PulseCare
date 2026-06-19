import express from 'express';
import {
  createPatient,
  updatePatient,
  getPatientById,
  listPatients
} from '../controllers/patientController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validateRequest } from '../middlewares/requestValidator.js';
import { createPatientSchema, updatePatientSchema } from '../validators/patientValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Apply JWT authentication on all patient routes
router.use(authenticateJWT);

router.post(
  '/',
  authorizeRoles('Hospital Admin', 'Receptionist'),
  validateRequest(createPatientSchema),
  asyncHandler(createPatient)
);

router.get(
  '/',
  authorizeRoles('Hospital Admin', 'Receptionist', 'Doctor', 'Nurse', 'Patient', 'Super Admin', 'Billing Executive'),
  asyncHandler(listPatients)
);

router.get(
  '/:id',
  authorizeRoles('Hospital Admin', 'Receptionist', 'Doctor', 'Nurse', 'Patient', 'Super Admin', 'Billing Executive'),
  asyncHandler(getPatientById)
);

router.put(
  '/:id',
  authorizeRoles('Hospital Admin', 'Receptionist', 'Patient'),
  validateRequest(updatePatientSchema),
  asyncHandler(updatePatient)
);

export default router;
