const { validationResult } = require('express-validator');
const db = require('../database/jsonDatabase');
const ViaturaService = require('../services/ViaturaService');
const GeolocalizacaoService = require('../services/GeolocalizacaoService');

class ViaturaController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { placa, prefixo, tipo, orgaoId } = req.body;

      try {
        const viatura = await ViaturaService.criarViatura({
          placa,
          prefixo,
          tipo,
          orgaoId
        });

        // Log de auditoria
        db.create('logs', {
          usuarioId: req.user.id,
          acao: 'CRIAR_VIATURA',
          descricao: `Viatura ${prefixo} (${placa}) criada`,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });

        res.status(201).json(viatura);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      console.error('Erro ao criar viatura:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async list(req, res) {
    try {
      const { status, tipo, orgaoId } = req.query;
      
      const filtros = {};
      if (status) filtros.status = status;
      if (tipo) filtros.tipo = tipo;
      if (orgaoId) filtros.orgaoId = orgaoId;
      
      const viaturas = await ViaturaService.listarViaturas(filtros);
      
      res.json(viaturas);
    } catch (error) {
      console.error('Erro ao listar viaturas:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const viatura = db.findById('viaturas', id);

      if (!viatura) {
        return res.status(404).json({ error: 'Viatura não encontrada' });
      }

      // Buscar dados relacionados
      const geolocalizacao = db.findOne('geolocalizacao', { viaturaId: id });
      const painel = db.findOne('painelViaturas', { viaturaId: id });
      const orgao = db.findById('orgaos', viatura.orgaoId);

      res.json({
        ...viatura,
        geolocalizacao,
        painel,
        orgao
      });
    } catch (error) {
      console.error('Erro ao buscar viatura:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Não permitir alteração de placa e prefixo
      delete updates.placa;
      delete updates.prefixo;

      const viaturaAtualizada = db.update('viaturas', id, updates);

      if (!viaturaAtualizada) {
        return res.status(404).json({ error: 'Viatura não encontrada' });
      }

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'ATUALIZAR_VIATURA',
        descricao: `Viatura ${viaturaAtualizada.prefixo} atualizada`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      res.json(viaturaAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar viatura:', error);
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
      const statusPermitidos = ['Disponível', 'Em Deslocamento', 'No Local', 'Manutenção', 'Indisponível'];
      if (!statusPermitidos.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }
      
      try {
        const viaturaAtualizada = await ViaturaService.atualizarStatusViatura(id, status, observacoes);
        
        // Log de auditoria
        db.create('logs', {
          usuarioId: req.user.id,
          acao: 'ATUALIZAR_STATUS_VIATURA',
          descricao: `Status da viatura ${viaturaAtualizada.prefixo} atualizado para ${status}`,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
        
        // WebSocket: notificar atualização
        req.io.emit('status-atualizado', { tipo: 'viatura', data: viaturaAtualizada });
        
        res.json(viaturaAtualizada);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      console.error('Erro ao atualizar status da viatura:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getDisponiveis(req,res) {
    try {
      const viaturas = await ViaturaService.obterViaturasDisponiveis();
      res.json(viaturas);
    } catch (error) {
      console.error('Erro ao listar viaturas disponíveis:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getProximas(req, res) {
    try {
      const { lat, lng, raio } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude e longitude são obrigatórios' });
      }
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const raioKm = raio ? parseFloat(raio) : 10;
      
      const viaturas = await ViaturaService.obterViaturasProximas(latitude, longitude, raioKm);
      res.json(viaturas);
    } catch (error) {
      console.error('Erro ao listar viaturas próximas:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }
}

module.exports = new ViaturaController();