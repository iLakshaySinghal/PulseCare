import mongoose from 'mongoose';
import logger from './logger.js';

export const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hms_db';
    
    const options = {
      maxPoolSize: 50,
      autoIndex: true, // Auto-build indexes in development; might disable in heavy prod
    };

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected.');
    });

    await mongoose.connect(connUri, options);
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
