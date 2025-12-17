const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').notEmpty().withMessage('Senha é obrigatória')
  ],
  AuthController.login
);

// Verificar token
router.get('/verificar', authMiddleware, AuthController.verificarToken);

// Alterar senha
router.post(
  '/alterar-senha',
  authMiddleware,
  [
    body('senhaAtual').notEmpty().withMessage('Senha atual é obrigatória'),
    body('novaSenha')
      .isLength({ min: 6 })
      .withMessage('Nova senha deve ter pelo menos 6 caracteres')
  ],
  AuthController.alterarSenha
);

// Logout
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;