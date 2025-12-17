const express = require('express');
const { body, param } = require('express-validator');
const OcorrenciaController = require('../controllers/OcorrenciaController');
const FluxoOcorrenciaService = require('../services/FluxoOcorrenciaService');
const stateMachine = require('../services/OcorrenciaStateMachine');
const { authMiddleware, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// ===== CASOS DE USO SIMPLIFICADOS =====

// CSU01 - Receber ocorrência (criar nova ocorrência)
router.post(
  '/',
  [
    body('tipo').notEmpty().withMessage('Tipo é obrigatório'),
    body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
    body('localizacao').notEmpty().withMessage('Localização é obrigatória'),
    body('latitude').isNumeric().withMessage('Latitude deve ser numérica'),
    body('longitude').isNumeric().withMessage('Longitude deve ser numérica'),
    body('centralChamadasId').notEmpty().withMessage('ID da chamada é obrigatório')
  ],
  checkRole('Sistema', 'Central', 'PMMG', 'DHPP', 'Administrador'),
  async (req, res) => {
    try {
      const ocorrencia = await FluxoOcorrenciaService.processarNovaOcorrencia(req.body);
      
      // Notificar via WebSocket
      if (req.io) {
        req.io.emit('nova-ocorrencia', ocorrencia);
      }
      
      res.status(201).json(ocorrencia);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// CSU01.1 - Atender ocorrência (iniciar atendimento)
router.post(
  '/:id/atender',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Policial', 'PMMG', 'DHPP'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const ocorrencia = await FluxoOcorrenciaService.iniciarAtendimento(id, req.user.id);
      
      // Notificar via WebSocket
      if (req.io) {
        req.io.emit('atendimento-iniciado', { ocorrenciaId: id, ocorrencia });
      }
      
      res.json(ocorrencia);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// CSU01.2 - Solicitar equipe DHPP
router.post(
  '/:id/solicitar-dhpp',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Policial', 'PMMG', 'Central'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const solicitacao = await FluxoOcorrenciaService.solicitarEquipeDHPP(id, req.user.id);
      
      // Notificar DHPP via WebSocket
      if (req.io) {
        req.io.to('orgao-dhpp').emit('solicitacao-dhpp', { ocorrenciaId: id, solicitacao });
      }
      
      res.json(solicitacao);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// CSU01.3 - Chamar reforço policial
router.post(
  '/:id/solicitar-reforco',
  [
    param('id').notEmpty().withMessage('ID é obrigatório'),
    body('nivelUrgencia').isInt({ min: 1, max: 5 }).withMessage('Nível de urgência deve ser entre 1 e 5')
  ],
  checkRole('Policial', 'PMMG'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nivelUrgencia } = req.body;
      
      const reforco = await FluxoOcorrenciaService.solicitarReforco(id, req.user.id, nivelUrgencia);
      
      // Notificar central via WebSocket
      if (req.io) {
        req.io.to('central').emit('reforco-solicitado', { ocorrenciaId: id, reforco });
      }
      
      res.json(reforco);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// CSU01.4 - Finalizar atendimento
router.post(
  '/despacho/:despachoId/finalizar',
  [
    param('despachoId').notEmpty().withMessage('ID do despacho é obrigatório'),
    body('acoes').notEmpty().withMessage('Ações realizadas são obrigatórias')
  ],
  checkRole('Policial', 'PMMG', 'DHPP'),
  async (req, res) => {
    try {
      const { despachoId } = req.params;
      const { acoes } = req.body;
      
      const resultado = await FluxoOcorrenciaService.finalizarAtendimento(despachoId, acoes);
      
      // Notificar via WebSocket
      if (req.io) {
        req.io.emit('atendimento-finalizado', { 
          despachoId, 
          ocorrenciaId: resultado.ocorrencia.id,
          resultado 
        });
      }
      
      res.json(resultado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// CSU01.1.1 - Consultar ocorrência (com detalhes completos)
router.get(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const ocorrencia = await FluxoOcorrenciaService.consultarOcorrencia(id);
      res.json(ocorrencia);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
);

// CSU01.1.2 - Registrar detalhes do atendimento
router.post(
  '/despacho/:despachoId/registrar-detalhes',
  [
    param('despachoId').notEmpty().withMessage('ID do despacho é obrigatório'),
    body('detalhes').notEmpty().withMessage('Detalhes são obrigatórios')
  ],
  checkRole('Policial', 'PMMG', 'DHPP'),
  async (req, res) => {
    try {
      const { despachoId } = req.params;
      const { detalhes } = req.body;
      
      const despacho = await FluxoOcorrenciaService.registrarDetalhesAtendimento(despachoId, detalhes);
      
      res.json(despacho);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ===== ROTAS AUXILIARES =====

// Listar ocorrências (mantido para compatibilidade)
router.get('/', OcorrenciaController.list);

// Buscar ocorrência por protocolo
router.get('/protocolo/:protocolo', OcorrenciaController.getByProtocolo);

// Obter transições disponíveis para uma ocorrência
router.get(
  '/:id/transicoes',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const ocorrencia = await FluxoOcorrenciaService.consultarOcorrencia(id);
      
      res.json({
        estadoAtual: ocorrencia.status,
        transicoesDisponiveis: ocorrencia.transicoesDisponiveis,
        podeSerFinalizada: stateMachine.canFinalize(id)
      });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
);

// Obter histórico de transições
router.get(
  '/:id/historico',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const historico = stateMachine.getTransitionHistory(id);
      res.json(historico);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
);

// Atualizar ocorrência (mantido para compatibilidade, mas com validação de estado)
router.put(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Administrador'),
  OcorrenciaController.update
);

// Encerrar ocorrência (DEPRECATED - usar finalizar atendimento)
router.put(
  '/:id/encerrar',
  [
    param('id').notEmpty().withMessage('ID é obrigatório'),
    body('observacoes').optional()
  ],
  checkRole('Central', 'PMMG', 'DHPP', 'Policial', 'Administrador'),
  async (req, res) => {
    res.status(410).json({ 
      error: 'Rota descontinuada. Use POST /despacho/:despachoId/finalizar' 
    });
  }
);

// Deletar ocorrência (apenas para administradores)
router.delete(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID é obrigatório')
  ],
  checkRole('Administrador'),
  OcorrenciaController.delete
);

module.exports = router;