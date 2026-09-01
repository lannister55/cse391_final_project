import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../services/api';

/**
 * useSocket — returns a stable ref to a Socket.io client instance.
 *
 * The socket connects on mount and disconnects on unmount.
 * Use socketRef.current to access the socket inside your component.
 */
const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(API_URL, {
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
