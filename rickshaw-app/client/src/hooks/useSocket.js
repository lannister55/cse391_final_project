import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * useSocket — returns a stable ref to a Socket.io client instance.
 *
 * The socket connects on mount and disconnects on unmount.
 * Use socketRef.current to access the socket inside your component.
 */
const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to the backend server
    // In development, this connects to localhost:5000
    // In production, this connects to the same origin as the API
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    socketRef.current = io(serverUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return () => {
      // Clean up when the component unmounts
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef;
};

export default useSocket;
