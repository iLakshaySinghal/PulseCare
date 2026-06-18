import express from 'express';
import {
  createAppointment,
  updateAppointmentStatus,
  setAvailability,
  getDoctorAvailability,
  listAppointments,
  getDoctorsList,
  getNursesList
} from '../controllers/appointmentController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validateRequest } from '../middlewares/requestValidator.js';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  doctorAvailabilitySchema
} from '../validators/appointmentValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authenticateJWT);

router.get(
  '/doctors',
  authorizeRoles('Patient', 'Receptionist', 'Doctor', 'Nurse', 'Hospital Admin', 'Super Admin'),
  asyncHandler(getDoctorsList)
);

router.get(
  '/nurses',
  authorizeRoles('Patient', 'Receptionist', 'Doctor', 'Nurse', 'Hospital Admin', 'Super Admin'),
  asyncHandler(getNursesList)
);

router.post(
  '/',
  authorizeRoles('Patient', 'Receptionist', 'Hospital Admin', 'Super Admin', 'Doctor'),
  validateRequest(createAppointmentSchema),
  asyncHandler(createAppointment)
);

router.get(
  '/',
  authorizeRoles('Patient', 'Receptionist', 'Doctor', 'Nurse', 'Hospital Admin', 'Super Admin'),
  asyncHandler(listAppointments)
);

router.put(
  '/:id/status',
  authorizeRoles('Receptionist', 'Doctor', 'Nurse', 'Hospital Admin', 'Super Admin', 'Patient'),
  validateRequest(updateAppointmentStatusSchema),
  asyncHandler(updateAppointmentStatus)
);

router.post(
  '/availability',
  authorizeRoles('Doctor', 'Hospital Admin', 'Super Admin'),
  validateRequest(doctorAvailabilitySchema),
  asyncHandler(setAvailability)
);

router.get(
  '/availability/:doctorId',
  asyncHandler(getDoctorAvailability)
);

export default router;
