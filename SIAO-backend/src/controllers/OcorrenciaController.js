const { validationResult } = require('express-validator');
const db = require('../database/jsonDatabase');
const OcorrenciaService = require('../services/OcorrenciaService');

class OcorrenciaController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { tipo, descricao, localizacao, latitude, longitude, centralChamadasId } = req.body;

      const ocorrencia = await OcorrenciaService.criarOcorrencia({
        tipo,
        descricao,
        localizacao,
        latitude,
        longitude,
        centralChamadasId
      });

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'CRIAR_OCORRENCIA',
        descricao: `Ocorrência ${ocorrencia.protocolo} criada`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      // WebSocket: notificar órgão responsável
      req.io.to(`orgao-${ocorrencia.orgaoId}`).emit('nova-ocorrencia', ocorrencia);

      res.status(201).json(ocorrencia);
    } catch (error) {
      console.error('Erro ao criar ocorrência:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async list(req, res) {
    try {
      const { status, tipo, orgaoId, dataInicio, dataFim, latitude, longitude, raio } = req.query;
      
      // Se latitude e longitude foram fornecidas, buscar ocorrências próximas
      if (latitude && longitude) {
        return this.getOcorrenciasProximas(req, res);
      }
      
      const filtros = {};
      if (status) filtros.status = status;
      if (tipo) filtros.tipo = tipo;
      if (orgaoId) filtros.orgaoId = orgaoId;
      if (dataInicio && dataFim) {
        filtros.dataInicio = dataInicio;
        filtros.dataFim = dataFim;
      }
      
      const ocorrencias = await OcorrenciaService.buscarOcorrenciasComDetalhes(filtros);

      res.json({
        success: true,
        data: ocorrencias,
        total: ocorrencias.length
      });
    } catch (error) {
      console.error('Erro ao listar ocorrências:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getOcorrenciasProximas(req, res) {
    try {
      const { latitude, longitude, raio } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: 'Latitude e longitude são obrigatórios',
          success: false 
        });
      }
      
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const raioKm = raio ? parseFloat(raio) : 10;
      
      // Validar coordenadas
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          error: 'Coordenadas inválidas',
          success: false 
        });
      }
      
      // Buscar todas as ocorrências
      const todasOcorrencias = db.findAll('ocorrencias');
      
      // Filtrar por proximidade
      const ocorrenciasProximas = todasOcorrencias
        .map(ocorrencia => ({
          ...ocorrencia,
          distancia: this.calcularDistancia(lat, lng, ocorrencia.latitude, ocorrencia.longitude)
        }))
        .filter(ocorrencia => ocorrencia.distancia <= raioKm)
        .sort((a, b) => a.distancia - b.distancia);
      
      // Enriquecer com dados relacionados
      const ocorrenciasDetalhadas = ocorrenciasProximas.map(ocorrencia => {
        const centralChamada = db.findById('centralChamadas', ocorrencia.centralChamadasId);
        const orgao = db.findById('orgaos', ocorrencia.orgaoId);
        const despachos = db.findAll('despachos').filter(d => d.ocorrenciaId === ocorrencia.id);
        
        return {
          ...ocorrencia,
          centralChamada,
          orgao,
          despachos
        };
      });
      
      res.json({
        success: true,
        data: ocorrenciasDetalhadas,
        total: ocorrenciasDetalhadas.length,
        parametros: {
          latitude: lat,
          longitude: lng,
          raio: raioKm
        }
      });
    } catch (error) {
      console.error('Erro ao buscar ocorrências próximas:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor', 
        message: error.message,
        success: false 
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const ocorrencia = db.findById('ocorrencias', id);

      if (!ocorrencia) {
        return res.status(404).json({ error: 'Ocorrência não encontrada' });
      }

      // Buscar dados relacionados
      const centralChamada = db.findById('centralChamadas', ocorrencia.centralChamadasId);
      const orgao = db.findById('orgaos', ocorrencia.orgaoId);
      const despachos = db.findAll('despachos').filter(d => d.ocorrenciaId === id);

      res.json({
        ...ocorrencia,
        centralChamada,
        orgao,
        despachos
      });
    } catch (error) {
      console.error('Erro ao buscar ocorrência:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getByProtocolo(req, res) {
    try {
      const { protocolo } = req.params;
      const ocorrencia = db.findOne('ocorrencias', { protocolo });

      if (!ocorrencia) {
        return res.status(404).json({ error: 'Ocorrência não encontrada' });
      }

      // Buscar dados relacionados
      const centralChamada = db.findById('centralChamadas', ocorrencia.centralChamadasId);
      const orgao = db.findById('orgaos', ocorrencia.orgaoId);
      const despachos = db.findAll('despachos').filter(d => d.ocorrenciaId === ocorrencia.id);

      res.json({
        ...ocorrencia,
        centralChamada,
        orgao,
        despachos
      });
    } catch (error) {
      console.error('Erro ao buscar ocorrência por protocolo:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Não permitir alteração do protocolo
      delete updates.protocolo;

      const ocorrenciaAtualizada = db.update('ocorrencias', id, updates);

      if (!ocorrenciaAtualizada) {
        return res.status(404).json({ error: 'Ocorrência não encontrada' });
      }

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'ATUALIZAR_OCORRENCIA',
        descricao: `Ocorrência ${ocorrenciaAtualizada.protocolo} atualizada`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      // WebSocket: notificar atualização
      req.io.emit('status-atualizado', { tipo: 'ocorrencia', data: ocorrenciaAtualizada });

      res.json(ocorrenciaAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar ocorrência:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async encerrar(req, res) {
    try {
      const { id } = req.params;
      const { observacoes } = req.body;

      try {
        const ocorrenciaEncerrada = await OcorrenciaService.encerrarOcorrencia(id, observacoes);

        // Log de auditoria
        db.create('logs', {
          usuarioId: req.user.id,
          acao: 'ENCERRAR_OCORRENCIA',
          descricao: `Ocorrência ${ocorrenciaEncerrada.protocolo} encerrada`,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });

        // WebSocket: notificar encerramento
        req.io.emit('status-atualizado', { tipo: 'ocorrencia', data: ocorrenciaEncerrada });

        res.json(ocorrenciaEncerrada);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      console.error('Erro ao encerrar ocorrência:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = db.delete('ocorrencias', id);

      if (!deleted) {
        return res.status(404).json({ error: 'Ocorrência não encontrada' });
      }

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'DELETAR_OCORRENCIA',
        descricao: `Ocorrência ${id} deletada`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      res.json({ message: 'Ocorrência deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar ocorrência:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  // Método auxiliar para calcular distância
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

module.exports = new OcorrenciaController();