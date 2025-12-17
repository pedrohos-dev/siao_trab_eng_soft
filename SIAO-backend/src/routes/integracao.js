/**
 * Rotas para Integração com Sistemas Externos
 * Endpoints para receber chamadas de sistemas externos
 */

const express = require('express');
const { body } = require('express-validator');
const ChamadasController = require('../components/integracao-chamadas/ChamadasController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// ===== ROTAS DE INTEGRAÇÃO DE CHAMADAS =====

// Receber chamada de sistema externo
router.post(
  '/chamadas/receber',
  [
    body('external_protocol').notEmpty().withMessage('Protocolo externo é obrigatório'),
    body('incident_type').notEmpty().withMessage('Tipo de incidente é obrigatório'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('location').notEmpty().withMessage('Localização é obrigatória'),
    body('latitude').isNumeric().withMessage('Latitude deve ser numérica'),
    body('longitude').isNumeric().withMessage('Longitude deve ser numérica'),
    body('system_id').optional().isString().withMessage('ID do sistema deve ser string'),
    body('caller_name').optional().isString().withMessage('Nome do chamador deve ser string'),
    body('caller_phone').optional().isString().withMessage('Telefone deve ser string'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Prioridade inválida')
  ],
  checkRole('Sistema', 'Administrador'),
  ChamadasController.receberChamada
);

// Processar lote de chamadas
router.post(
  '/chamadas/lote',
  [
    body('chamadas').isArray().withMessage('Chamadas deve ser um array'),
    body('chamadas.*.external_protocol').notEmpty().withMessage('Protocolo externo é obrigatório'),
    body('chamadas.*.incident_type').notEmpty().withMessage('Tipo de incidente é obrigatório'),
    body('chamadas.*.description').notEmpty().withMessage('Descrição é obrigatória'),
    body('chamadas.*.location').notEmpty().withMessage('Localização é obrigatória'),
    body('chamadas.*.latitude').isNumeric().withMessage('Latitude deve ser numérica'),
    body('chamadas.*.longitude').isNumeric().withMessage('Longitude deve ser numérica')
  ],
  checkRole('Sistema', 'Administrador'),
  ChamadasController.processarLote
);

// Buscar chamadas pendentes no sistema externo
router.get(
  '/chamadas/pendentes',
  checkRole('Sistema', 'Central', 'Administrador'),
  ChamadasController.buscarPendentes
);

// Status da integração
router.get(
  '/chamadas/status',
  ChamadasController.status
);

// ===== ROTAS DE TESTE E MONITORAMENTO =====

// Endpoint de teste para validar integração
router.post(
  '/chamadas/teste',
  checkRole('Administrador'),
  async (req, res) => {
    try {
      const chamadaTeste = {
        external_protocol: `TESTE-${Date.now()}`,
        system_id: 'SISTEMA_TESTE',
        incident_type: 'DISTURBANCE',
        description: 'Chamada de teste da integração',
        location: 'Endereço de teste, 123 - Centro',
        latitude: -19.9167,
        longitude: -43.9345,
        caller_name: 'Usuário Teste',
        caller_phone: '(31) 99999-9999',
        priority: 'LOW',
        timestamp: new Date().toISOString(),
        notes: 'Esta é uma chamada de teste'
      };

      const ChamadasAdapter = require('../components/integracao-chamadas/ChamadasAdapter');
      const resultado = await ChamadasAdapter.receberChamadaExterna(chamadaTeste);

      res.json({
        success: true,
        message: 'Teste de integração executado com sucesso',
        data: resultado
      });

    } catch (error) {
      res.status(500).json({
        error: 'Erro no teste de integração',
        message: error.message
      });
    }
  }
);

// Webhook para confirmações (simulado)
router.post(
  '/chamadas/webhook/confirmacao',
  checkRole('Sistema'),
  async (req, res) => {
    try {
      const { external_protocol, status, message } = req.body;

      // Log da confirmação recebida
      const db = require('../database/jsonDatabase');
      db.create('logs', {
        tipo: 'WEBHOOK_CONFIRMACAO',
        protocoloExterno: external_protocol,
        status,
        message,
        timestamp: new Date().toISOString()
      });

      console.log(`📨 Webhook recebido: ${external_protocol} - ${status}`);

      res.json({
        success: true,
        message: 'Confirmação recebida',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Erro ao processar webhook',
        message: error.message
      });
    }
  }
);

// Estatísticas de integração
router.get(
  '/estatisticas',
  checkRole('Central', 'Administrador'),
  async (req, res) => {
    try {
      const periodo = req.query.periodo || '24h';
      const db = require('../database/jsonDatabase');
      
      // Calcular data de início baseada no período
      const agora = new Date();
      let dataInicio;
      
      switch (periodo) {
        case '1h':
          dataInicio = new Date(agora.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          dataInicio = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          dataInicio = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
      }

      // Buscar logs de integração
      const logs = db.findAll('logs').filter(log => 
        new Date(log.timestamp) >= dataInicio &&
        (log.tipo.includes('INTEGRACAO') || log.tipo.includes('WEBHOOK'))
      );

      const estatisticas = {
        periodo,
        totalChamadasRecebidas: logs.filter(l => l.tipo === 'INTEGRACAO_CHAMADA_EXTERNA').length,
        sucessos: logs.filter(l => l.tipo === 'INTEGRACAO_CHAMADA_EXTERNA').length,
        erros: logs.filter(l => l.tipo === 'ERRO_INTEGRACAO_CHAMADA').length,
        confirmacoesEnviadas: logs.filter(l => l.tipo === 'CONFIRMACAO_ENVIADA').length,
        webhooksRecebidos: logs.filter(l => l.tipo === 'WEBHOOK_CONFIRMACAO').length,
        sistemasOrigem: this.agruparPorCampo(logs.filter(l => l.sistemaOrigem), 'sistemaOrigem'),
        ultimaAtualizacao: new Date().toISOString()
      };

      res.json({
        success: true,
        data: estatisticas
      });

    } catch (error) {
      res.status(500).json({
        error: 'Erro ao obter estatísticas',
        message: error.message
      });
    }
  }
);

// Método auxiliar para agrupar por campo
function agruparPorCampo(items, campo) {
  return items.reduce((acc, item) => {
    const valor = item[campo] || 'Não informado';
    acc[valor] = (acc[valor] || 0) + 1;
    return acc;
  }, {});
}

module.exports = router;