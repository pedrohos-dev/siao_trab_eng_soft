const express = require('express');
const { body, param } = require('express-validator');
const DespachoController = require('../controllers/DespachoController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Listar despachos
router.get('/', DespachoController.list);

// Buscar despacho por ID
router.get('/:id', DespachoController.getById);

// Criar despacho
router.post(
  '/',
  [
    body('ocorrenciaId').notEmpty().withMessage('ID da ocorrência é obrigatório'),
    body('viaturaId').notEmpty().withMessage('ID da viatura é obrigatório')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  DespachoController.create
);

// Registrar chegada
router.put(
  '/:id/chegada',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Policial', 'Administrador'),
  DespachoController.registrarChegada
);

// Registrar ações
router.post(
  '/:id/acoes',
  [
    param('id').notEmpty().withMessage('ID é obrigatório'),
    body('acoes').notEmpty().withMessage('Ações são obrigatórias')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Policial', 'Administrador'),
  DespachoController.registrarAcoes
);

// Atualizar status
router.put(
  '/:id/status',
  [
    param('id').notEmpty().withMessage('ID é obrigatório'),
    body('status').notEmpty().withMessage('Status é obrigatório')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Policial', 'Administrador'),
  DespachoController.atualizarStatus
);

// Encontrar viatura próxima
router.get(
  '/viatura-proxima/:ocorrenciaId',
  [
    param('ocorrenciaId').notEmpty().withMessage('ID da ocorrência é obrigatório')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  DespachoController.encontrarViaturaProxima
);

module.exports = router;