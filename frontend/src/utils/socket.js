import { io } from 'socket.io-client';

let socket = null;

export const initiateSocketConnection = () => {
  if (socket) return socket;

  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  // Connects to server origin
  socket = io(window.location.origin || 'http://localhost:5000', {
    auth: {
      token
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true
  });

  socket.on('connect', () => {
    console.log('Socket.IO connection established with server');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket.IO connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket.IO connection terminated');
  }
};

export const getSocket = () => {
  if (!socket) {
    return initiateSocketConnection();
  }
  return socket;
};

export default {
  initiateSocketConnection,
  disconnectSocket,
  getSocket
};
