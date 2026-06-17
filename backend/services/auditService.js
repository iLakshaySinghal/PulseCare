import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

/**
 * Logs an event to the AuditLogs collection in MongoDB.
 * Encapsulated in a try-catch to prevent core operation failures from database issues.
 */
export const logAuditEvent = async ({
  userId,
  action,
  resource,
  resourceId,
  ipAddress = '127.0.0.1',
  userAgent = 'Unknown Client',
  changes = null
}) => {
  try {
    const logData = {
      userId,
      action,
      resource,
      resourceId: String(resourceId),
      ipAddress,
      userAgent
    };

    if (changes) {
      logData.changes = {
        before: changes.before || {},
        after: changes.after || {}
      };
    }

    await AuditLog.create(logData);
    logger.debug(`Audit log recorded: ${action} on ${resource} (${resourceId})`);
  } catch (error) {
    logger.error(`HIPAA Compliance Failure: Failed to write audit log event: ${error.message}`);
  }
};

export default {
  logAuditEvent
};
