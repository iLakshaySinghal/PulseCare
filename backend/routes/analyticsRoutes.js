import express from 'express';
import {
  getExecutiveMetrics,
  getRevenueMetrics,
  getOperationalMetrics,
  getDepartmentalMetrics
} from '../controllers/analyticsController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(authorizeRoles('Super Admin', 'Hospital Admin'));

router.get('/executive', asyncHandler(getExecutiveMetrics));
router.get('/revenue', asyncHandler(getRevenueMetrics));
router.get('/operational', asyncHandler(getOperationalMetrics));
router.get('/departments', asyncHandler(getDepartmentalMetrics));

export default router;
