const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatar email');

      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`Socket connected: ${socket.user.name} (${socket.id})`);

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    // Join a trip room for real-time collaboration
    socket.on('trip:join', (tripId) => {
      socket.join(`trip:${tripId}`);
      socket.to(`trip:${tripId}`).emit('user:online', {
        userId,
        name: socket.user.name,
        avatar: socket.user.avatar,
      });
      logger.debug(`${socket.user.name} joined trip room: ${tripId}`);
    });

    socket.on('trip:leave', (tripId) => {
      socket.leave(`trip:${tripId}`);
      socket.to(`trip:${tripId}`).emit('user:offline', { userId });
    });

    // Typing indicator for comments
    socket.on('comment:typing', ({ tripId, targetId }) => {
      socket.to(`trip:${tripId}`).emit('comment:typing', {
        userId,
        name: socket.user.name,
        targetId,
      });
    });

    socket.on('comment:stopTyping', ({ tripId }) => {
      socket.to(`trip:${tripId}`).emit('comment:stopTyping', { userId });
    });

    // Cursor position for collaborative editing (activity reorder etc)
    socket.on('cursor:move', ({ tripId, position }) => {
      socket.to(`trip:${tripId}`).emit('cursor:move', {
        userId,
        name: socket.user.name,
        avatar: socket.user.avatar,
        position,
      });
    });

    // User is actively viewing a specific day
    socket.on('day:viewing', ({ tripId, dayNumber }) => {
      socket.to(`trip:${tripId}`).emit('day:viewing', {
        userId,
        name: socket.user.name,
        avatar: socket.user.avatar,
        dayNumber,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.user.name}`);
      // Notify all trip rooms user was in
      socket.rooms.forEach((room) => {
        if (room.startsWith('trip:')) {
          const tripId = room.replace('trip:', '');
          socket.to(room).emit('user:offline', { userId });
        }
      });
    });
  });

  logger.info('Socket.IO initialized');
  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };