/**
 * Rotas para gerenciar Reforços Policiais
 * CRUD completo para sistema de reforços
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const ReforcoController = require('../controllers/ReforcoController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// ===== ROTAS PRINCIPAIS =====

// Solicitar reforço policial
router.post(
  '/',
  [
    body('ocorrenciaId').notEmpty().withMessage('ID da ocorrência é obrigatório'),
    body('nivelUrgencia').isInt({ min: 1, max: 5 }).withMessage('Nível de urgência deve ser entre 1 e 5'),
    body('tipoReforco').optional().isString().withMessage('Tipo de reforço deve ser string'),
    body('observacoes').optional().isString().withMessage('Observações devem ser string')
  ],
  checkRole('Policial', 'PMMG', 'DHPP', 'Central'),
  ReforcoController.solicitar
);

// Atender solicitação de reforço
router.put(
  '/:id/atender',
  [
    param('id').notEmpty().withMessage('ID do reforço é obrigatório'),
    body('viaturaId').notEmpty().withMessage('ID da viatura é obrigatório'),
    body('observacoes').optional().isString().withMessage('Observações devem ser string')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  ReforcoController.atender
);

// Cancelar solicitação de reforço
router.put(
  '/:id/cancelar',
  [
    param('id').notEmpty().withMessage('ID do reforço é obrigatório'),
    body('motivo').notEmpty().withMessage('Motivo do cancelamento é obrigatório')
  ],
  checkRole('Policial', 'PMMG', 'DHPP', 'Central', 'Administrador'),
  ReforcoController.cancelar
);

// Listar reforços com filtros
router.get(
  '/',
  [
    query('status').optional().isIn(['PENDENTE', 'ATENDIDO', 'CANCELADO']).withMessage('Status inválido'),
    query('nivelUrgencia').optional().isInt({ min: 1, max: 5 }).withMessage('Nível de urgência inválido'),
    query('dataInicio').optional().isISO8601().withMessage('Data de início inválida'),
    query('dataFim').optional().isISO8601().withMessage('Data de fim inválida')
  ],
  ReforcoController.listar
);

// Obter detalhes de um reforço específico
router.get(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID do reforço é obrigatório')
  ],
  ReforcoController.obter
);

// ===== ROTAS ESPECIAIS =====

// Obter estatísticas de reforços
router.get(
  '/dashboard/estatisticas',
  [
    query('periodo').optional().isIn(['24h', '7d', '30d']).withMessage('Período inválido')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  ReforcoController.estatisticas
);

// Listar reforços pendentes (para dashboard)
router.get(
  '/dashboard/pendentes',
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  ReforcoController.pendentes
);

// Obter reforços por ocorrência
router.get(
  '/ocorrencia/:ocorrenciaId',
  [
    param('ocorrenciaId').notEmpty().withMessage('ID da ocorrência é obrigatório')
  ],
  ReforcoController.porOcorrencia
);

// Atualizar observações de um reforço
router.put(
  '/:id/observacoes',
  [
    param('id').notEmpty().withMessage('ID do reforço é obrigatório'),
    body('observacoes').notEmpty().withMessage('Observações são obrigatórias')
  ],
  checkRole('Policial', 'PMMG', 'DHPP', 'Central', 'Administrador'),
  ReforcoController.atualizarObservacoes
);

// ===== ROTAS DE MONITORAMENTO =====

// Obter reforços por status
router.get(
  '/status/:status',
  [
    param('status').isIn(['PENDENTE', 'ATENDIDO', 'CANCELADO']).withMessage('Status inválido')
  ],
  async (req, res) => {
    try {
      const { status } = req.params;
      const ReforcoService = require('../services/ReforcoService');
      
      const resultado = await ReforcoService.listarReforcos({ status });
      
      res.json({
        success: true,
        data: resultado.reforcos,
        total: resultado.total
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
);

// Obter reforços por nível de urgência
router.get(
  '/urgencia/:nivel',
  [
    param('nivel').isInt({ min: 1, max: 5 }).withMessage('Nível de urgência inválido')
  ],
  async (req, res) => {
    try {
      const { nivel } = req.params;
      const ReforcoService = require('../services/ReforcoService');
      
      const resultado = await ReforcoService.listarReforcos({ 
        nivelUrgencia: parseInt(nivel) 
      });
      
      res.json({
        success: true,
        data: resultado.reforcos,
        total: resultado.total
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
);

// Obter histórico de reforços de um usuário
router.get(
  '/usuario/:usuarioId/historico',
  [
    param('usuarioId').notEmpty().withMessage('ID do usuário é obrigatório')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  async (req, res) => {
    try {
      const { usuarioId } = req.params;
      const ReforcoService = require('../services/ReforcoService');
      
      const resultado = await ReforcoService.listarReforcos({ 
        solicitadoPor: usuarioId 
      });
      
      res.json({
        success: true,
        data: resultado.reforcos,
        total: resultado.total
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
);

module.exports = router;