import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);

    if (socket.user.role === 'driver') {
      socket.join('drivers');
    }

    socket.on('driver:location', async (location) => {
      if (socket.user.role !== 'driver') return;

      await User.findByIdAndUpdate(socket.user._id, { currentLocation: location });
      io.emit('driver:location', {
        driverId: socket.user._id,
        location,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};
