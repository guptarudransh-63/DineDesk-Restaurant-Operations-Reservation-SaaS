import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket.io connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
    });
  }
  return socket;
};

export const joinRoom = (room) => {
  const s = getSocket();
  if (s && room) {
    s.emit('join', room);
  }
};

export const leaveRoom = (room) => {
  const s = getSocket();
  if (s && room) {
    s.emit('leave', room);
  }
};
