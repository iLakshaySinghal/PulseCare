import express from 'express';
import { getMyNotifications } from '../controllers/notificationController.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', getMyNotifications);

export default router;
