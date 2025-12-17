const express = require('express');
const RelatorioController = require('../controllers/RelatorioController');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Relatório de ocorrências
router.get(
  '/ocorrencias',
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  RelatorioController.gerarRelatorioOcorrencias
);

// Relatório de despachos
router.get(
  '/despachos',
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  RelatorioController.gerarRelatorioDespachos
);

// Relatório de desempenho
router.get(
  '/desempenho',
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  RelatorioController.gerarRelatorioDesempenho
);

module.exports = router;