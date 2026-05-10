import { create } from 'zustand';
import { io } from 'socket.io-client';

const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],
  viewingUsers: [],

  connect: (token) => {
    if (get().socket?.connected) return;
    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('connect', () => set({ socket }));
    socket.on('user:online', (u) =>
      set((s) => ({ onlineUsers: [...s.onlineUsers.filter((x) => x.userId !== u.userId), u] }))
    );
    socket.on('user:offline', ({ userId }) =>
      set((s) => ({ onlineUsers: s.onlineUsers.filter((u) => u.userId !== userId) }))
    );
    socket.on('day:viewing', (u) =>
      set((s) => ({ viewingUsers: [...s.viewingUsers.filter((x) => x.userId !== u.userId), u] }))
    );
    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, onlineUsers: [], viewingUsers: [] });
  },

  joinTrip: (tripId) => get().socket?.emit('trip:join', tripId),
  leaveTrip: (tripId) => get().socket?.emit('trip:leave', tripId),
  emitViewing: (tripId, dayNumber) => get().socket?.emit('day:viewing', { tripId, dayNumber }),
}));

export default useSocketStore;