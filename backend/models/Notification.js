import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Email', 'In-App'],
    default: 'Email'
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Sent', 'Failed'],
    default: 'Pending'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String,
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

NotificationSchema.index({ recipientId: 1, status: 1 });

export const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
