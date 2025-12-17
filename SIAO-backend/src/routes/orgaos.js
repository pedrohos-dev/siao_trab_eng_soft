const express = require('express');
const { body, param } = require('express-validator');
const OrgaoController = require('../controllers/OrgaoController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Listar órgãos
router.get('/', OrgaoController.list);

// Buscar órgão por ID
router.get('/:id', OrgaoController.getById);

// Criar órgão
router.post(
  '/',
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('sigla').notEmpty().withMessage('Sigla é obrigatória'),
    body('tipo').notEmpty().withMessage('Tipo é obrigatório'),
    body('telefone').notEmpty().withMessage('Telefone é obrigatório'),
    body('endereco').notEmpty().withMessage('Endereço é obrigatório')
  ],
  checkRole('Administrador'),
  OrgaoController.create
);

// Atualizar órgão
router.put(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Administrador'),
  OrgaoController.update
);

// Ativar/desativar órgão
router.put(
  '/:id/toggle-ativo',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Administrador'),
  OrgaoController.toggleAtivo
);

module.exports = router;