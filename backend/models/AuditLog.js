import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  changes: {
    before: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false // We use our own timestamp
});

// HIPAA Indexing Policies
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog;
