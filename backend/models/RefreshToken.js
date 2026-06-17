import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true // SHA-256 hashed refresh token string
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  replacedByToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// TTL index to automatically drop expired token documents from MongoDB
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1 });

export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
export default RefreshToken;
