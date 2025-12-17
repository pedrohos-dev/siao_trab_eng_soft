/**
 * Controller para gerenciar Reforços Policiais
 * CRUD completo para sistema de reforços
 */

const ReforcoService = require('../services/ReforcoService');
const { validationResult } = require('express-validator');

class ReforcoController {

  /**
   * Solicita um novo reforço policial
   * POST /api/reforcos
   */
  async solicitar(req, res) {
    try {
      // Validar dados de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const dadosReforco = {
        ...req.body,
        solicitadoPor: req.user.id // Usar ID do usuário autenticado
      };

      const reforco = await ReforcoService.solicitarReforco(dadosReforco);

      // Notificar via WebSocket
      if (req.io) {
        // Notificar central de operações
        req.io.to('central-operacoes').emit('novo-reforco-solicitado', {
          reforco,
          solicitante: req.user.nome,
          urgencia: reforco.nivelUrgencia
        });

        // Se urgência alta, notificar todas as viaturas próximas
        if (reforco.nivelUrgencia >= 4) {
          req.io.emit('reforco-urgente', {
            reforcoId: reforco.id,
            ocorrenciaId: reforco.ocorrenciaId,
            nivelUrgencia: reforco.nivelUrgencia
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Reforço solicitado com sucesso',
        data: reforco
      });

    } catch (error) {
      console.error('Erro ao solicitar reforço:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Atende uma solicitação de reforço
   * PUT /api/reforcos/:id/atender
   */
  async atender(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const dadosAtendimento = {
        ...req.body,
        usuarioResponsavel: req.user.id
      };

      const resultado = await ReforcoService.atenderReforco(id, dadosAtendimento);

      // Notificar via WebSocket
      if (req.io) {
        req.io.emit('reforco-atendido', {
          reforcoId: id,
          viatura: resultado.despacho.viaturaId,
          responsavel: req.user.nome
        });

        // Notificar viatura específica
        req.io.to(`viatura-${resultado.despacho.viaturaId}`).emit('novo-despacho-reforco', {
          despacho: resultado.despacho,
          reforco: resultado.reforco
        });
      }

      res.json({
        success: true,
        message: 'Reforço atendido com sucesso',
        data: resultado
      });

    } catch (error) {
      console.error('Erro ao atender reforço:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Cancela uma solicitação de reforço
   * PUT /api/reforcos/:id/cancelar
   */
  async cancelar(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { motivo } = req.body;

      const reforco = await ReforcoService.cancelarReforco(id, motivo, req.user.id);

      // Notificar via WebSocket
      if (req.io) {
        req.io.emit('reforco-cancelado', {
          reforcoId: id,
          motivo,
          canceladoPor: req.user.nome
        });
      }

      res.json({
        success: true,
        message: 'Reforço cancelado com sucesso',
        data: reforco
      });

    } catch (error) {
      console.error('Erro ao cancelar reforço:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Lista reforços com filtros
   * GET /api/reforcos
   */
  async listar(req, res) {
    try {
      const filtros = {
        status: req.query.status,
        nivelUrgencia: req.query.nivelUrgencia,
        ocorrenciaId: req.query.ocorrenciaId,
        solicitadoPor: req.query.solicitadoPor,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim
      };

      // Remover filtros vazios
      Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
      });

      const resultado = await ReforcoService.listarReforcos(filtros);

      res.json({
        success: true,
        data: resultado.reforcos,
        total: resultado.total,
        filtros: resultado.filtros
      });

    } catch (error) {
      console.error('Erro ao listar reforços:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém detalhes de um reforço específico
   * GET /api/reforcos/:id
   */
  async obter(req, res) {
    try {
      const { id } = req.params;
      const reforco = await ReforcoService.obterReforco(id);

      res.json({
        success: true,
        data: reforco
      });

    } catch (error) {
      console.error('Erro ao obter reforço:', error);
      
      if (error.message === 'Reforço não encontrado') {
        return res.status(404).json({
          error: 'Reforço não encontrado'
        });
      }

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de reforços
   * GET /api/reforcos/estatisticas
   */
  async estatisticas(req, res) {
    try {
      const periodo = req.query.periodo || '30d';
      const estatisticas = await ReforcoService.obterEstatisticas(periodo);

      res.json({
        success: true,
        data: estatisticas
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Lista reforços pendentes (para dashboard)
   * GET /api/reforcos/pendentes
   */
  async pendentes(req, res) {
    try {
      const resultado = await ReforcoService.listarReforcos({ status: 'PENDENTE' });

      // Ordenar por urgência e data
      const reforcosPendentes = resultado.reforcos.sort((a, b) => {
        if (a.nivelUrgencia !== b.nivelUrgencia) {
          return b.nivelUrgencia - a.nivelUrgencia;
        }
        return new Date(a.dataHoraSolicitacao) - new Date(b.dataHoraSolicitacao);
      });

      res.json({
        success: true,
        data: reforcosPendentes,
        total: reforcosPendentes.length
      });

    } catch (error) {
      console.error('Erro ao listar reforços pendentes:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém reforços por ocorrência
   * GET /api/reforcos/ocorrencia/:ocorrenciaId
   */
  async porOcorrencia(req, res) {
    try {
      const { ocorrenciaId } = req.params;
      const resultado = await ReforcoService.listarReforcos({ ocorrenciaId });

      res.json({
        success: true,
        data: resultado.reforcos,
        total: resultado.total
      });

    } catch (error) {
      console.error('Erro ao obter reforços por ocorrência:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Atualiza observações de um reforço
   * PUT /api/reforcos/:id/observacoes
   */
  async atualizarObservacoes(req, res) {
    try {
      const { id } = req.params;
      const { observacoes } = req.body;

      if (!observacoes) {
        return res.status(400).json({
          error: 'Observações são obrigatórias'
        });
      }

      const db = require('../database/jsonDatabase');
      const reforco = db.update('reforcosPolicia', id, {
        observacoes,
        ultimaAtualizacao: new Date().toISOString(),
        atualizadoPor: req.user.id
      });

      if (!reforco) {
        return res.status(404).json({
          error: 'Reforço não encontrado'
        });
      }

      // Log da atualização
      db.create('logs', {
        tipo: 'REFORCO_OBSERVACOES_ATUALIZADAS',
        reforcoId: id,
        usuarioId: req.user.id,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Observações atualizadas com sucesso',
        data: reforco
      });

    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new ReforcoController();