const express = require('express');
const { body, param } = require('express-validator');
const GeolocalizacaoController = require('../controllers/GeolocalizacaoController');
const GeoService = require('../services/GeolocalizacaoService');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// ===== CSU02 - Enviar Geolocalização =====

// CSU02 - Enviar geolocalização (atualização contínua)
router.post(
  '/atualizar',
  [
    body('viaturaId').notEmpty().withMessage('ID da viatura é obrigatório'),
    body('latitude').isNumeric().withMessage('Latitude deve ser numérica'),
    body('longitude').isNumeric().withMessage('Longitude deve ser numérica'),
    body('velocidade').optional().isNumeric().withMessage('Velocidade deve ser numérica'),
    body('precisao').optional().isNumeric().withMessage('Precisão deve ser numérica'),
    body('timestamp').optional().isISO8601().withMessage('Timestamp deve ser uma data válida')
  ],
  checkRole('Sistema', 'PMMG', 'DHPP', 'Policial'),
  async (req, res) => {
    try {
      const { viaturaId, latitude, longitude, velocidade, precisao, timestamp } = req.body;
      
      // Atualizar posição usando o serviço
      const posicao = await GeoService.atualizarPosicaoViatura(
        viaturaId,
        parseFloat(latitude),
        parseFloat(longitude),
        velocidade ? parseFloat(velocidade) : 0,
        precisao ? parseFloat(precisao) : null,
        timestamp ? new Date(timestamp) : new Date()
      );

      // Broadcast via WebSocket para todos os interessados
      if (req.io) {
        req.io.emit('posicao-viatura-atualizada', {
          viaturaId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          velocidade: velocidade ? parseFloat(velocidade) : 0,
          precisao: precisao ? parseFloat(precisao) : null,
          timestamp: posicao.dataHoraAtualizacao
        });

        // Notificar especificamente a central de monitoramento
        req.io.to('central-monitoramento').emit('tracking-update', {
          viaturaId,
          posicao: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            velocidade: velocidade ? parseFloat(velocidade) : 0,
            timestamp: posicao.dataHoraAtualizacao
          }
        });
      }

      res.json({
        success: true,
        posicao,
        message: 'Posição atualizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar geolocalização:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Envio em lote de posições (para otimização de rede)
router.post(
  '/atualizar-lote',
  [
    body('posicoes').isArray().withMessage('Posições deve ser um array'),
    body('posicoes.*.viaturaId').notEmpty().withMessage('ID da viatura é obrigatório'),
    body('posicoes.*.latitude').isNumeric().withMessage('Latitude deve ser numérica'),
    body('posicoes.*.longitude').isNumeric().withMessage('Longitude deve ser numérica'),
    body('posicoes.*.timestamp').isISO8601().withMessage('Timestamp deve ser uma data válida')
  ],
  checkRole('Sistema', 'PMMG', 'DHPP', 'Policial'),
  async (req, res) => {
    try {
      const { posicoes } = req.body;
      const resultados = [];

      for (const pos of posicoes) {
        try {
          const posicao = await GeoService.atualizarPosicaoViatura(
            pos.viaturaId,
            parseFloat(pos.latitude),
            parseFloat(pos.longitude),
            pos.velocidade ? parseFloat(pos.velocidade) : 0,
            pos.precisao ? parseFloat(pos.precisao) : null,
            new Date(pos.timestamp)
          );

          resultados.push({
            viaturaId: pos.viaturaId,
            success: true,
            posicao
          });

          // Broadcast individual
          if (req.io) {
            req.io.emit('posicao-viatura-atualizada', {
              viaturaId: pos.viaturaId,
              latitude: parseFloat(pos.latitude),
              longitude: parseFloat(pos.longitude),
              velocidade: pos.velocidade ? parseFloat(pos.velocidade) : 0,
              timestamp: posicao.dataHoraAtualizacao
            });
          }
        } catch (error) {
          resultados.push({
            viaturaId: pos.viaturaId,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        processadas: resultados.length,
        sucessos: resultados.filter(r => r.success).length,
        erros: resultados.filter(r => !r.success).length,
        resultados
      });
    } catch (error) {
      console.error('Erro ao processar lote de posições:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ===== ROTAS AUXILIARES =====

// Atualizar posição da viatura (mantido para compatibilidade)
router.post(
  '/',
  [
    body('viaturaId').notEmpty().withMessage('ID da viatura é obrigatório'),
    body('latitude').isNumeric().withMessage('Latitude deve ser numérica'),
    body('longitude').isNumeric().withMessage('Longitude deve ser numérica'),
    body('velocidade').optional().isNumeric().withMessage('Velocidade deve ser numérica')
  ],
  checkRole('PMMG', 'DHPP', 'Policial', 'Administrador'),
  GeolocalizacaoController.atualizarPosicao
);

// Obter posição atual da viatura
router.get(
  '/viatura/:viaturaId',
  [
    param('viaturaId').notEmpty().withMessage('ID da viatura é obrigatório')
  ],
  async (req, res) => {
    try {
      const { viaturaId } = req.params;
      const posicao = await GeoService.obterPosicaoViatura(viaturaId);
      
      if (!posicao) {
        return res.status(404).json({ error: 'Posição não encontrada para esta viatura' });
      }

      res.json(posicao);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Obter histórico de posições da viatura
router.get(
  '/viatura/:viaturaId/historico',
  [
    param('viaturaId').notEmpty().withMessage('ID da viatura é obrigatório')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  GeolocalizacaoController.getHistoricoPosicoes
);

// Obter viaturas próximas a um ponto
router.get(
  '/viaturas-proximas',
  GeolocalizacaoController.getViaturasProximas
);

// Obter todas as posições atuais (para mapa em tempo real)
router.get(
  '/posicoes-atuais',
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  async (req, res) => {
    try {
      const posicoes = await GeoService.obterTodasPosicoesAtuais();
      res.json(posicoes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Verificar se viatura está em movimento
router.get(
  '/viatura/:viaturaId/status-movimento',
  [
    param('viaturaId').notEmpty().withMessage('ID da viatura é obrigatório')
  ],
  async (req, res) => {
    try {
      const { viaturaId } = req.params;
      const status = await GeoService.verificarStatusMovimento(viaturaId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;