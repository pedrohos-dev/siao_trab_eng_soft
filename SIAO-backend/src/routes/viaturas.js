const express = require('express');
const { body, param } = require('express-validator');
const ViaturaController = require('../controllers/ViaturaController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Listar viaturas
router.get('/', ViaturaController.list);

// Listar viaturas disponíveis
router.get('/disponiveis', ViaturaController.getDisponiveis);

// Listar viaturas próximas
router.get('/proximas', ViaturaController.getProximas);

// Buscar viatura por ID
router.get('/:id', ViaturaController.getById);

// Criar viatura
router.post(
  '/',
  [
    body('placa').notEmpty().withMessage('Placa é obrigatória'),
    body('prefixo').notEmpty().withMessage('Prefixo é obrigatório'),
    body('tipo').notEmpty().withMessage('Tipo é obrigatório'),
    body('orgaoId').notEmpty().withMessage('ID do órgão é obrigatório')
  ],
  checkRole('PMMG', 'DHPP', 'Administrador'),
  ViaturaController.create
);

// Atualizar viatura
router.put(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('PMMG', 'DHPP', 'Administrador'),
  ViaturaController.update
);

// Atualizar status da viatura
router.put(
  '/:id/status',
  [
    param('id').notEmpty().withMessage('ID é obrigatório'),
    body('status').notEmpty().withMessage('Status é obrigatório')
  ],
  checkRole('PMMG', 'DHPP', 'Policial', 'Administrador'),
  ViaturaController.atualizarStatus
);

module.exports = router;