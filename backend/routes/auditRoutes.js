import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(authorizeRoles('Super Admin', 'Hospital Admin'));

router.get('/', getAuditLogs);

export default router;
