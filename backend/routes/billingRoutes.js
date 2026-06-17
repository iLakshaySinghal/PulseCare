import express from 'express';
import {
  getUnbilledItemsController,
  createInvoice,
  listInvoices,
  getInvoiceById,
  processPayment,
  submitInsuranceClaim,
  processInsuranceApproval
} from '../controllers/billingController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authenticateJWT);

router.get(
  '/unbilled/:patientId',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor', 'Nurse', 'Billing Executive'),
  asyncHandler(getUnbilledItemsController)
);

router.post(
  '/invoices',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Billing Executive'),
  asyncHandler(createInvoice)
);

router.get(
  '/invoices',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Billing Executive', 'Patient'),
  asyncHandler(listInvoices)
);

router.get(
  '/invoices/:id',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Billing Executive', 'Patient'),
  asyncHandler(getInvoiceById)
);

router.post(
  '/payments',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Billing Executive', 'Patient'),
  asyncHandler(processPayment)
);

router.post(
  '/insurance/claim',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Billing Executive'),
  asyncHandler(submitInsuranceClaim)
);

router.post(
  '/insurance/approve',
  authorizeRoles('Super Admin', 'Hospital Admin', 'Billing Executive'),
  asyncHandler(processInsuranceApproval)
);

export default router;
