import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    // Conectar ao servidor WebSocket
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket conectado');
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error.message);
    });

    setSocket(socketInstance);

    // Cleanup ao desmontar
    return () => {
      socketInstance.disconnect();
    };
  }, [token, user]);

  return socket;
};