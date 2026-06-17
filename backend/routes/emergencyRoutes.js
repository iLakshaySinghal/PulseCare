import express from 'express';
import {
  registerEmergencyCase,
  assignStaff,
  updateTreatment,
  listEmergencyCases,
  getEmergencyCaseById
} from '../controllers/emergencyController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validateRequest } from '../middlewares/requestValidator.js';
import {
  registerEmergencySchema,
  assignStaffSchema,
  updateEmergencyTreatmentSchema
} from '../validators/emergencyValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authenticateJWT);

router.post(
  '/register',
  authorizeRoles('Nurse', 'Receptionist', 'Hospital Admin', 'Super Admin'),
  validateRequest(registerEmergencySchema),
  asyncHandler(registerEmergencyCase)
);

router.get(
  '/cases',
  authorizeRoles('Doctor', 'Nurse', 'Hospital Admin', 'Super Admin'),
  asyncHandler(listEmergencyCases)
);

router.get(
  '/cases/:id',
  authorizeRoles('Doctor', 'Nurse', 'Hospital Admin', 'Super Admin'),
  asyncHandler(getEmergencyCaseById)
);

router.put(
  '/cases/:id/assign',
  authorizeRoles('Nurse', 'Doctor', 'Hospital Admin', 'Super Admin'),
  validateRequest(assignStaffSchema),
  asyncHandler(assignStaff)
);

router.put(
  '/cases/:id/treatment',
  authorizeRoles('Doctor', 'Nurse'),
  validateRequest(updateEmergencyTreatmentSchema),
  asyncHandler(updateTreatment)
);

export default router;
