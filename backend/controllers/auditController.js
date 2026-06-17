import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/audit-logs
 * Fetch and filter paginated audit logs (Admin and Super Admin only)
 */
export const getAuditLogs = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, userId, action, resource } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build filters dynamically
  const filter = {};
  if (userId) filter.userId = userId;
  if (action) filter.action = action;
  if (resource) filter.resource = resource;

  const logs = await AuditLog.find(filter)
    .populate('userId', 'firstName lastName email role')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await AuditLog.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: 'Audit logs retrieved successfully',
    data: {
      logs,
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
  getAuditLogs
};
