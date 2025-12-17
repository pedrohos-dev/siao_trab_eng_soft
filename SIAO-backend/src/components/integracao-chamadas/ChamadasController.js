/**
 * Controller para Integração com Sistema de Chamadas
 * Expõe endpoints para receber chamadas de sistemas externos
 */

const ChamadasAdapter = require('./ChamadasAdapter');
const { validationResult } = require('express-validator');

class ChamadasController {

  /**
   * Recebe uma chamada de sistema externo
   * POST /api/integracao/chamadas/receber
   */
  async receberChamada(req, res) {
    try {
      // Validar dados de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const chamadaExterna = req.body;
      
      // Processar através do adapter
      const resultado = await ChamadasAdapter.receberChamadaExterna(chamadaExterna);

      // Notificar via WebSocket
      if (req.io) {
        req.io.emit('nova-ocorrencia-externa', {
          ocorrencia: resultado.ocorrencia,
          protocoloExterno: resultado.protocoloExterno
        });
      }

      // Enviar confirmação para sistema externo
      await ChamadasAdapter.enviarConfirmacao(
        resultado.protocoloExterno,
        resultado.protocoloInterno,
        'PROCESSED'
      );

      res.status(201).json({
        success: true,
        message: 'Chamada processada com sucesso',
        data: {
          protocoloInterno: resultado.protocoloInterno,
          protocoloExterno: resultado.protocoloExterno,
          ocorrenciaId: resultado.ocorrencia.id,
          status: resultado.ocorrencia.status
        }
      });

    } catch (error) {
      console.error('Erro no controller de chamadas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Processa lote de chamadas
   * POST /api/integracao/chamadas/lote
   */
  async processarLote(req, res) {
    try {
      const { chamadas } = req.body;

      if (!Array.isArray(chamadas) || chamadas.length === 0) {
        return res.status(400).json({
          error: 'Lista de chamadas inválida'
        });
      }

      const resultado = await ChamadasAdapter.processarLoteChamadas(chamadas);

      res.json({
        success: true,
        message: 'Lote processado',
        data: resultado
      });

    } catch (error) {
      console.error('Erro ao processar lote:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Busca chamadas pendentes no sistema externo
   * GET /api/integracao/chamadas/pendentes
   */
  async buscarPendentes(req, res) {
    try {
      const chamadas = await ChamadasAdapter.buscarChamadasPendentes();

      res.json({
        success: true,
        data: chamadas,
        total: chamadas.length
      });

    } catch (error) {
      console.error('Erro ao buscar pendentes:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Endpoint de status da integração
   * GET /api/integracao/chamadas/status
   */
  async status(req, res) {
    try {
      const db = require('../../database/jsonDatabase');
      
      // Estatísticas das últimas 24h
      const agora = new Date();
      const ontemMesmaHora = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

      const logs = db.findAll('logs').filter(log => 
        new Date(log.timestamp) >= ontemMesmaHora &&
        log.tipo.includes('INTEGRACAO')
      );

      const estatisticas = {
        ultimasVinteQuatroHoras: {
          totalChamadas: logs.filter(l => l.tipo === 'INTEGRACAO_CHAMADA_EXTERNA').length,
          sucessos: logs.filter(l => l.tipo === 'INTEGRACAO_CHAMADA_EXTERNA').length,
          erros: logs.filter(l => l.tipo === 'ERRO_INTEGRACAO_CHAMADA').length,
          confirmacoesEnviadas: logs.filter(l => l.tipo === 'CONFIRMACAO_ENVIADA').length
        },
        statusIntegracao: 'ATIVO',
        ultimaAtualizacao: new Date().toISOString()
      };

      res.json({
        success: true,
        data: estatisticas
      });

    } catch (error) {
      console.error('Erro ao obter status:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new ChamadasController();