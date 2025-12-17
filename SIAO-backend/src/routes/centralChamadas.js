const express = require('express');
const { body, param } = require('express-validator');
const CentralChamadasController = require('../controllers/CentralChamadasController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Listar chamadas
router.get('/', CentralChamadasController.list);

// Buscar chamada por ID
router.get('/:id', CentralChamadasController.getById);

// Criar chamada
router.post(
  '/',
  [
    body('nomeChamador').notEmpty().withMessage('Nome do chamador é obrigatório'),
    body('telefoneChamador').notEmpty().withMessage('Telefone do chamador é obrigatório'),
    body('enderecoChamador').notEmpty().withMessage('Endereço do chamador é obrigatório')
  ],
  checkRole('Central', 'Administrador'),
  CentralChamadasController.create
);

// Atualizar chamada
router.put(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Central', 'Administrador'),
  CentralChamadasController.update
);

module.exports = router;