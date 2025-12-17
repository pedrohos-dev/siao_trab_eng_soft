const { validationResult } = require('express-validator');
const db = require('../database/jsonDatabase');

class OrgaoController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nome, sigla, tipo, telefone, endereco } = req.body;

      // Verificar se já existe órgão com mesma sigla
      const orgaoExistente = db.findOne('orgaos', { sigla });
      if (orgaoExistente) {
        return res.status(400).json({ error: 'Já existe um órgão com esta sigla' });
      }

      const orgao = db.create('orgaos', {
        nome,
        sigla,
        tipo,
        telefone,
        endereco,
        ativo: true
      });

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'CRIAR_ORGAO',
        descricao: `Órgão ${sigla} criado`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(orgao);
    } catch (error) {
      console.error('Erro ao criar órgão:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async list(req, res) {
    try {
      const { ativo } = req.query;
      
      let orgaos = db.findAll('orgaos');
      
      // Filtrar por status ativo
      if (ativo !== undefined) {
        const isAtivo = ativo === 'true';
        orgaos = orgaos.filter(o => o.ativo === isAtivo);
      }
      
      res.json(orgaos);
    } catch (error) {
      console.error('Erro ao listar órgãos:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const orgao = db.findById('orgaos', id);

      if (!orgao) {
        return res.status(404).json({ error: 'Órgão não encontrado' });
      }

      res.json(orgao);
    } catch (error) {
      console.error('Erro ao buscar órgão:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Verificar se órgão existe
      const orgao = db.findById('orgaos', id);
      if (!orgao) {
        return res.status(404).json({ error: 'Órgão não encontrado' });
      }

      // Se estiver atualizando a sigla, verificar se já existe
      if (updates.sigla && updates.sigla !== orgao.sigla) {
        const orgaoExistente = db.findOne('orgaos', { sigla: updates.sigla });
        if (orgaoExistente) {
          return res.status(400).json({ error: 'Já existe um órgão com esta sigla' });
        }
      }

      const orgaoAtualizado = db.update('orgaos', id, updates);

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'ATUALIZAR_ORGAO',
        descricao: `Órgão ${orgaoAtualizado.sigla} atualizado`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      res.json(orgaoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar órgão:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async toggleAtivo(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se órgão existe
      const orgao = db.findById('orgaos', id);
      if (!orgao) {
        return res.status(404).json({ error: 'Órgão não encontrado' });
      }
      
      const orgaoAtualizado = db.update('orgaos', id, {
        ativo: !orgao.ativo
      });
      
      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: orgaoAtualizado.ativo ? 'ATIVAR_ORGAO' : 'DESATIVAR_ORGAO',
        descricao: `Órgão ${orgaoAtualizado.sigla} ${orgaoAtualizado.ativo ? 'ativado' : 'desativado'}`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      res.json(orgaoAtualizado);
    } catch (error) {
      console.error('Erro ao alterar status do órgão:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }
}

module.exports = new OrgaoController();