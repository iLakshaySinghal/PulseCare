import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import logger from './config/logger.js';
import { initSocket } from './config/socket.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start Server Listening
const server = app.listen(PORT, () => {
  logger.info(`HMS Backend Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Initialize Socket.IO
initSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED PROMISE REJECTION: ${err.message}`);
  logger.error(err.stack || '');
  
  // Close server and exit process
  server.close(() => {
    logger.warn('Server closed due to unhandled promise rejection. Exiting process.');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.message}`);
  logger.error(err.stack || '');
  
  server.close(() => {
    logger.warn('Server closed due to uncaught exception. Exiting process.');
    process.exit(1);
  });
});
