import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/notifications
 * Fetch transactional notification history for the logged-in user
 */
export const getMyNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const notifications = await Notification.find({ recipientId: req.user.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Notification.countDocuments({ recipientId: req.user.id });

  res.status(200).json({
    success: true,
    message: 'Notifications list retrieved successfully',
    data: {
      notifications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

export default {
  getMyNotifications
};
