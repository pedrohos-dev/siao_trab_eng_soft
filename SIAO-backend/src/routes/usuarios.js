const express = require('express');
const { body, param } = require('express-validator');
const UsuarioController = require('../controllers/UsuarioController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Listar usuários (apenas para administradores)
router.get(
  '/',
  checkRole('Administrador'),
  UsuarioController.list
);

// Buscar usuário por ID
router.get(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Administrador'),
  UsuarioController.getById
);

// Criar usuário
router.post(
  '/',
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('perfil').notEmpty().withMessage('Perfil é obrigatório')
  ],
  checkRole('Administrador'),
  UsuarioController.create
);

// Atualizar usuário
router.put(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Administrador'),
  UsuarioController.update
);

// Ativar/desativar usuário
router.put(
  '/:id/toggle-ativo',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Administrador'),
  UsuarioController.toggleAtivo
);

// Resetar senha
router.post(
  '/:id/resetar-senha',
  [
    param('id').notEmpty().withMessage('ID é obrigatório'),
    body('novaSenha').isLength({ min: 6 }).withMessage('Nova senha deve ter pelo menos 6 caracteres')
  ],
  checkRole('Administrador'),
  UsuarioController.resetarSenha
);

module.exports = router;