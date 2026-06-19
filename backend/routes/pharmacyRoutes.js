import express from 'express';
import {
  registerMedicine,
  listMedicines,
  addStock,
  listInventory,
  getDispensingQueue,
  dispensePrescription,
  getDispensedRecords,
  deleteMedicine,
  deleteInventory
} from '../controllers/pharmacyController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { validateRequest } from '../middlewares/requestValidator.js';
import {
  createMedicineSchema,
  addStockSchema,
  dispenseSchema
} from '../validators/pharmacyValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authenticateJWT);

router.post(
  '/medicines',
  authorizeRoles('Pharmacist', 'Hospital Admin', 'Super Admin'),
  validateRequest(createMedicineSchema),
  asyncHandler(registerMedicine)
);

router.get(
  '/medicines',
  authorizeRoles('Doctor', 'Nurse', 'Pharmacist', 'Hospital Admin', 'Super Admin'),
  asyncHandler(listMedicines)
);

router.post(
  '/inventory',
  authorizeRoles('Pharmacist'),
  validateRequest(addStockSchema),
  asyncHandler(addStock)
);

router.get(
  '/inventory',
  authorizeRoles('Doctor', 'Nurse', 'Pharmacist', 'Hospital Admin', 'Super Admin'),
  asyncHandler(listInventory)
);

router.get(
  '/dispense-queue',
  authorizeRoles('Doctor', 'Nurse', 'Pharmacist', 'Hospital Admin', 'Super Admin'),
  asyncHandler(getDispensingQueue)
);

router.post(
  '/dispense',
  authorizeRoles('Pharmacist'),
  validateRequest(dispenseSchema),
  asyncHandler(dispensePrescription)
);

router.get(
  '/dispense-records',
  authorizeRoles('Pharmacist', 'Hospital Admin', 'Super Admin'),
  asyncHandler(getDispensedRecords)
);

router.delete(
  '/medicines/:id',
  authorizeRoles('Pharmacist', 'Hospital Admin', 'Super Admin'),
  asyncHandler(deleteMedicine)
);

router.delete(
  '/inventory/:id',
  authorizeRoles('Pharmacist', 'Hospital Admin', 'Super Admin'),
  asyncHandler(deleteInventory)
);

export default router;
