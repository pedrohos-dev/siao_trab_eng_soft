const jwt = require('jsonwebtoken');
const db = require('../database/jsonDatabase');
const { jwtSecret } = require('../config/environment');

function setupWebSocket(io) {
  // Middleware de autenticação para WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token não fornecido'));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      const usuario = db.findById('usuarios', decoded.id);

      if (!usuario || !usuario.ativo) {
        return next(new Error('Usuário não encontrado ou inativo'));
      }

      socket.user = usuario;
      next();
    } catch (error) {
      return next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Cliente conectado: ${socket.user.nome} (${socket.user.email})`);

    // Entrar em room do órgão (se aplicável)
    if (socket.user.orgaoId) {
      socket.join(`orgao-${socket.user.orgaoId}`);
      console.log(`Usuario ${socket.user.nome} entrou no room orgao-${socket.user.orgaoId}`);
    }

    // Entrar em room do perfil
    socket.join(`perfil-${socket.user.perfil}`);

    // Evento: Atualizar posição da viatura
    socket.on('atualizar-posicao', async (data) => {
      const { viaturaId, latitude, longitude, velocidade } = data;

      try {
        const GeolocalizacaoService = require('../services/GeolocalizacaoService');
        const posicaoAtualizada = await GeolocalizacaoService.atualizarPosicaoViatura(
          viaturaId,
          latitude,
          longitude,
          velocidade
        );

        // Broadcast para todos
        io.emit('posicao-viatura', {
          viaturaId,
          latitude,
          longitude,
          velocidade,
          timestamp: new Date().toISOString()
        });

        console.log(`📍 Posição da viatura ${viaturaId} atualizada`);
      } catch (error) {
        console.error('Erro ao atualizar posição:', error);
        socket.emit('erro', { message: 'Erro ao atualizar posição' });
      }
    });

    // Evento: Aceitar despacho
    socket.on('aceitar-despacho', async (data) => {
      const { despachoId } = data;

      try {
        const despacho = db.update('despachos', despachoId, {
          status: 'Em Campo',
          dataHoraAceite: new Date().toISOString()
        });

        if (despacho) {
          io.emit('status-atualizado', {
            tipo: 'despacho',
            data: despacho
          });

          console.log(`✅ Despacho ${despachoId} aceito`);
        }
      } catch (error) {
        console.error('Erro ao aceitar despacho:', error);
        socket.emit('erro', { message: 'Erro ao aceitar despacho' });
      }
    });

    // Evento: Registrar chegada
    socket.on('registrar-chegada', async (data) => {
      const { despachoId } = data;

      try {
        const despacho = db.update('despachos', despachoId, {
          dataHoraChegada: new Date().toISOString()
        });

        if (despacho) {
          io.emit('status-atualizado', {
            tipo: 'despacho',
            data: despacho
          });

          console.log(`📍 Chegada registrada para despacho ${despachoId}`);
        }
      } catch (error) {
        console.error('Erro ao registrar chegada:', error);
        socket.emit('erro', { message: 'Erro ao registrar chegada' });
      }
    });

    // Desconexão
    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.user.nome}`);
    });
  });
}

module.exports = setupWebSocket;