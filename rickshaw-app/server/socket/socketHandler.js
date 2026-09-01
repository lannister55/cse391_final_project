export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a trip room (rider and driver join same room by tripId)
    socket.on('join-trip-room', (tripId) => {
      socket.join(tripId);
      console.log(`Socket ${socket.id} joined room: ${tripId}`);
    });

    // Leave a trip room
    socket.on('leave-trip-room', (tripId) => {
      socket.leave(tripId);
      console.log(`Socket ${socket.id} left room: ${tripId}`);
    });

    // Receive location update from driver and broadcast to the trip room (for rider)
    socket.on('update-location', ({ tripId, lat, lng }) => {
      socket.to(tripId).emit('driver-location-update', { lat, lng });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
