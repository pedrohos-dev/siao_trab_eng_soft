import { io } from 'socket.io-client';

let socket = null;

export const websocketService = {
  // Conectar ao WebSocket
  connect: (token) => {
    if (socket) {
      socket.disconnect();
    }

    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('WebSocket conectado');
    });

    socket.on('connect_error', (error) => {
      console.error('Erro na conexão WebSocket:', error.message);
    });

    return socket;
  },

  // Desconectar do WebSocket
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Enviar atualização de posição
  atualizarPosicao: (viaturaId, latitude, longitude, velocidade = 0) => {
    if (socket) {
      socket.emit('atualizar-posicao', {
        viaturaId,
        latitude,
        longitude,
        velocidade
      });
    }
  },

  // Aceitar despacho
  aceitarDespacho: (despachoId) => {
    if (socket) {
      socket.emit('aceitar-despacho', { despachoId });
    }
  },

  // Registrar chegada
  registrarChegada: (despachoId) => {
    if (socket) {
      socket.emit('registrar-chegada', { despachoId });
    }
  },

  // Obter instância do socket
  getSocket: () => socket
};