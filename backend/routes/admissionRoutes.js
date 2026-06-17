import express from 'express';
import {
  createAdmission,
  addVitalsLog,
  addTreatmentLog,
  dischargePatient,
  listAdmissions,
  getAdmissionById,
  listWards,
  createWard,
  listRooms,
  createRoom,
  listBeds,
  createBed
} from '../controllers/admissionController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authenticateJWT);

// Ward configuration routes
router.get(
  '/wards',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor', 'Nurse'),
  asyncHandler(listWards)
);
router.post(
  '/wards',
  authorizeRoles('Super Admin', 'Hospital Admin'),
  asyncHandler(createWard)
);

// Room configuration routes
router.get(
  '/rooms',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor', 'Nurse'),
  asyncHandler(listRooms)
);
router.post(
  '/rooms',
  authorizeRoles('Super Admin', 'Hospital Admin'),
  asyncHandler(createRoom)
);

// Bed configuration routes
router.get(
  '/beds',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor', 'Nurse'),
  asyncHandler(listBeds)
);
router.post(
  '/beds',
  authorizeRoles('Super Admin', 'Hospital Admin'),
  asyncHandler(createBed)
);

// core admissions routes
router.post(
  '/',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist'),
  asyncHandler(createAdmission)
);

router.get(
  '/',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient'),
  asyncHandler(listAdmissions)
);

router.get(
  '/:id',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient'),
  asyncHandler(getAdmissionById)
);

router.post(
  '/:id/vitals',
  authorizeRoles('Doctor', 'Nurse'),
  asyncHandler(addVitalsLog)
);

router.post(
  '/:id/treatment',
  authorizeRoles('Doctor', 'Nurse'),
  asyncHandler(addTreatmentLog)
);

router.post(
  '/:id/discharge',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Doctor', 'Nurse'),
  asyncHandler(dischargePatient)
);

export default router;
