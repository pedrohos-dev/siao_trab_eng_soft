const { validationResult } = require('express-validator');
const RelatorioService = require('../services/RelatorioService');
const db = require('../database/jsonDatabase');

class RelatorioController {
  async gerarRelatorioOcorrencias(req, res) {
    try {
      const { dataInicio, dataFim, tipo, status, orgaoId } = req.query;
      
      const filtros = {};
      if (dataInicio && dataFim) {
        filtros.dataInicio = dataInicio;
        filtros.dataFim = dataFim;
      }
      
      if (tipo) filtros.tipo = tipo;
      if (status) filtros.status = status;
      if (orgaoId) filtros.orgaoId = orgaoId;
      
      const relatorio = await RelatorioService.gerarRelatorioOcorrencias(filtros);
      
      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'GERAR_RELATORIO_OCORRENCIAS',
        descricao: `Relatório de ocorrências gerado`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      res.json(relatorio);
    } catch (error) {
      console.error('Erro ao gerar relatório de ocorrências:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async gerarRelatorioDespachos(req, res) {
    try {
      const { dataInicio, dataFim, status, ocorrenciaId, viaturaId } = req.query;
      
      const filtros = {};
      if (dataInicio && dataFim) {
        filtros.dataInicio = dataInicio;
        filtros.dataFim = dataFim;
      }
      
      if (status) filtros.status = status;
      if (ocorrenciaId) filtros.ocorrenciaId = ocorrenciaId;
      if (viaturaId) filtros.viaturaId = viaturaId;
      
      const relatorio = await RelatorioService.gerarRelatorioDespachos(filtros);
      
      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'GERAR_RELATORIO_DESPACHOS',
        descricao: `Relatório de despachos gerado`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      res.json(relatorio);
    } catch (error) {
      console.error('Erro ao gerar relatório de despachos:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async gerarRelatorioDesempenho(req, res) {
    try {
      const { dataInicio, dataFim } = req.query;
      
      const filtros = {};
      if (dataInicio && dataFim) {
        filtros.dataInicio = dataInicio;
        filtros.dataFim = dataFim;
      }
      
      const relatorio = await RelatorioService.gerarRelatorioDesempenho(filtros);
      
      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'GERAR_RELATORIO_DESEMPENHO',
        descricao: `Relatório de desempenho gerado`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      res.json(relatorio);
    } catch (error) {
      console.error('Erro ao gerar relatório de desempenho:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }
}

module.exports = new RelatorioController();