import mongoose from 'mongoose';

const AILogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  featureName: {
    type: String,
    required: true,
    enum: [
      'Symptom Analyzer',
      'Medical Record Summarizer',
      'Prescription Explainer',
      'Appointment Assistant',
      'Operations Intelligence'
    ]
  },
  promptText: {
    type: String,
    required: true
  },
  responseText: {
    type: String,
    required: true
  },
  tokenUsage: {
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 }
  },
  responseTimeMs: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Success', 'Error'],
    required: true
  },
  errorDetails: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

AILogSchema.index({ userId: 1 });
AILogSchema.index({ featureName: 1 });
AILogSchema.index({ createdAt: -1 });

export const AILog = mongoose.model('AILog', AILogSchema);
export default AILog;
