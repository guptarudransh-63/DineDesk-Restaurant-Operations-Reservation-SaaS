import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    // Join specific rooms
    socket.on('join', (room) => {
      if (room) {
        socket.join(room);
      }
    });

    socket.on('leave', (room) => {
      if (room) {
        socket.leave(room);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Safe emit helper to avoid crashes if socket isn't ready
export const emitEvent = (event, data, room = null) => {
  try {
    if (!io) return;
    if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }
  } catch (error) {
    console.error(`Socket emit failed for event "${event}":`, error.message);
  }
};
