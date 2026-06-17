import mongoose from 'mongoose';

const AnalyticsSnapshotSchema = new mongoose.Schema({
  snapshotDate: {
    type: Date,
    required: true,
    unique: true
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

AnalyticsSnapshotSchema.index({ snapshotDate: -1 });

export const AnalyticsSnapshot = mongoose.model('AnalyticsSnapshot', AnalyticsSnapshotSchema);
export default AnalyticsSnapshot;
