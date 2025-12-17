const { validationResult } = require('express-validator');
const db = require('../database/jsonDatabase');

class CentralChamadasController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nomeChamador, telefoneChamador, enderecoChamador, observacoes } = req.body;

      const chamada = db.create('centralChamadas', {
        nomeChamador,
        telefoneChamador,
        enderecoChamador,
        dataHoraChamada: new Date().toISOString(),
        observacoes
      });

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'CRIAR_CHAMADA',
        descricao: `Chamada registrada para ${nomeChamador}`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(chamada);
    } catch (error) {
      console.error('Erro ao criar chamada:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async list(req, res) {
    try {
      const { dataInicio, dataFim } = req.query;
      
      let chamadas = db.findAll('centralChamadas');
      
      // Filtrar por data
      if (dataInicio && dataFim) {
        chamadas = chamadas.filter(c => {
          const data = new Date(c.dataHoraChamada);
          return data >= new Date(dataInicio) && data <= new Date(dataFim);
        });
      }
      
      // Ordenar por data (mais recente primeiro)
      chamadas.sort((a, b) => new Date(b.dataHoraChamada) - new Date(a.dataHoraChamada));

      res.json(chamadas);
    } catch (error) {
      console.error('Erro ao listar chamadas:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const chamada = db.findById('centralChamadas', id);

      if (!chamada) {
        return res.status(404).json({ error: 'Chamada não encontrada' });
      }

      // Buscar ocorrências relacionadas
      const ocorrencias = db.findAll('ocorrencias', { centralChamadasId: id });

      res.json({
        ...chamada,
        ocorrencias
      });
    } catch (error) {
      console.error('Erro ao buscar chamada:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const chamadaAtualizada = db.update('centralChamadas', id, updates);

      if (!chamadaAtualizada) {
        return res.status(404).json({ error: 'Chamada não encontrada' });
      }

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'ATUALIZAR_CHAMADA',
        descricao: `Chamada ${id} atualizada`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      res.json(chamadaAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar chamada:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }
}

module.exports = new CentralChamadasController();