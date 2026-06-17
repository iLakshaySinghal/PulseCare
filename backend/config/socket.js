import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      logger.warn('Socket connection rejected: No authentication token provided.');
      return next(new Error('Authentication error: Token missing'));
    }

    const secret = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_key_9988776655';
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        logger.warn(`Socket connection rejected: Invalid token. ${err.message}`);
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.user = {
        id: decoded.userId,
        role: decoded.role
      };
      next();
    });
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user.id}, Role: ${socket.user.role})`);

    // Join room based on user ID
    socket.join(`user_${socket.user.id}`);

    // Join room based on role
    socket.join(`role_${socket.user.role}`);

    // Listen for custom events
    socket.on('join_emergency_room', () => {
      socket.join('emergency_room');
      logger.debug(`Socket ${socket.id} joined emergency_room`);
    });

    socket.on('leave_emergency_room', () => {
      socket.leave('emergency_room');
      logger.debug(`Socket ${socket.id} left emergency_room`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
};

export default {
  initSocket,
  getIO
};
