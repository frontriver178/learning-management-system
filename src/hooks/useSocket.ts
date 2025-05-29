import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import type { Socket as SocketType } from 'socket.io-client';

export const useSocket = (): SocketType | null => {
  const socketRef = useRef<SocketType | null>(null);

  useEffect(() => {
    socketRef.current = io();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
}; 