import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
export const useSocket = () => {
    const socketRef = useRef(null);
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
