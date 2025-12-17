const { validationResult } = require('express-validator');
const db = require('../database/jsonDatabase');
const DespachoService = require('../services/DespachoService');

class DespachoController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ocorrenciaId, viaturaId, observacoes } = req.body;

      try {
        const despacho = await DespachoService.criarDespacho(ocorrenciaId, viaturaId, observacoes);

        // Log de auditoria
        db.create('logs', {
          usuarioId: req.user.id,
          acao: 'CRIAR_DESPACHO',
          descricao: `Despacho criado para ocorrência ${ocorrenciaId}`,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });

        // WebSocket: notificar viatura
        req.io.emit('despacho-enviado', despacho);

        res.status(201).json(despacho);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      console.error('Erro ao criar despacho:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async list(req, res) {
    try {
      const { ocorrenciaId, viaturaId, status } = req.query;
      
      let filtro = {};
      if (ocorrenciaId) filtro.ocorrenciaId = ocorrenciaId;
      if (viaturaId) filtro.viaturaId = viaturaId;
      if (status) filtro.status = status;
      
      let despachos = db.findAll('despachos', filtro);
      
      // Enriquecer com dados de ocorrência e viatura
      const despachosDetalhados = await Promise.all(despachos.map(async d => {
        const ocorrencia = db.findById('ocorrencias', d.ocorrenciaId);
        const viatura = db.findById('viaturas', d.viaturaId);
        
        return {
          ...d,
          ocorrencia: ocorrencia ? {
            protocolo: ocorrencia.protocolo,
            tipo: ocorrencia.tipo,
            localizacao: ocorrencia.localizacao
          } : null,
          viatura: viatura ? {
            prefixo: viatura.prefixo,
            placa: viatura.placa,
            tipo: viatura.tipo
          } : null
        };
      }));
      
      // Ordenar por data (mais recente primeiro)
      despachosDetalhados.sort((a, b) => new Date(b.dataHoraDespacho) - new Date(a.dataHoraDespacho));

      res.json(despachosDetalhados);
    } catch (error) {
      console.error('Erro ao listar despachos:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const despacho = db.findById('despachos', id);

      if (!despacho) {
        return res.status(404).json({ error: 'Despacho não encontrado' });
      }

      // Buscar dados relacionados
      const ocorrencia = db.findById('ocorrencias', despacho.ocorrenciaId);
      const viatura = db.findById('viaturas', despacho.viaturaId);

      res.json({
        ...despacho,
        ocorrencia,
        viatura
      });
    } catch (error) {
      console.error('Erro ao buscar despacho:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async registrarChegada(req, res) {
    try {
      const { id } = req.params;
      
      try {
        const despachoAtualizado = await DespachoService.registrarChegada(id);
        
        // Log de auditoria
        db.create('logs', {
          usuarioId: req.user.id,
          acao: 'REGISTRAR_CHEGADA',
          descricao: `Chegada registrada para despacho ${id}`,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
        
        // WebSocket: notificar atualização
        req.io.emit('status-atualizado', { tipo: 'despacho', data: despachoAtualizado });
        
        res.json(despachoAtualizado);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      console.error('Erro ao registrar chegada:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async registrarAcoes(req, res) {
    try {
      const { id } = req.params;
      const { acoes } = req.body;
      
      if (!acoes) {
        return res.status(400).json({ error: 'Ações não informadas' });
      }
      
      try {
        const despachoAtualizado = await DespachoService.registrarAcoes(id, acoes);
        
        // Log de auditoria
        db.create('logs', {
          usuarioId: req.user.id,
          acao: 'REGISTRAR_ACOES',
          descricao: `Ações registradas para despacho ${id}`,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
        
        // WebSocket: notificar atualização
        req.io.emit('acao-registrada', { despachoId: id, acoes: despachoAtualizado.acoes });
        
        res.json(despachoAtualizado);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      console.error('Erro ao registrar ações:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, observacoes } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status não informado' });
      }
      
      // Validar status permitidos
      const statusPermitidos = ['Enviada', 'Em Campo', 'No Local', 'Concluído', 'Cancelado'];
      if (!statusPermitidos.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }
      
      const despacho = db.findById('despachos', id);
      if (!despacho) {
        return res.status(404).json({ error: 'Despacho não encontrado' });
      }
      
      // Atualizar status
      const despachoAtualizado = db.update('despachos', id, {
        status,
        observacoes: observacoes || despacho.observacoes
      });
      
      // Se status for Concluído, encerrar o despacho
      if (status === 'Concluído') {
        try {
          await DespachoService.encerrarDespacho(id, observacoes);
        } catch (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'ATUALIZAR_STATUS_DESPACHO',
        descricao: `Status do despacho ${id} atualizado para ${status}`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      // WebSocket: notificar atualização
      req.io.emit('status-atualizado', { tipo: 'despacho', data: despachoAtualizado });
      
      res.json(despachoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar status do despacho:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async encontrarViaturaProxima(req, res) {
    try {
      const { ocorrenciaId } = req.params;
      
      try {
        const viatura = await DespachoService.encontrarViaturaProxima(ocorrenciaId);
        res.json(viatura);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      console.error('Erro ao encontrar viatura próxima:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }
}

module.exports = new DespachoController();