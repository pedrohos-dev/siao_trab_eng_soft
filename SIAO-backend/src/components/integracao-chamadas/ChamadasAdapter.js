/**
 * Componente: Integração com Sistema de Chamadas
 * Interface: IacessoChamadas
 * Responsável por receber ocorrências do sistema externo
 */

const db = require('../../database/jsonDatabase');
const FluxoOcorrenciaService = require('../../services/FluxoOcorrenciaService');

class ChamadasAdapter {
  
  /**
   * Recebe uma chamada do sistema externo e converte para ocorrência
   * @param {Object} chamadaExterna - Dados da chamada externa
   * @returns {Object} - Ocorrência criada
   */
  async receberChamadaExterna(chamadaExterna) {
    try {
      console.log('📞 Recebendo chamada externa:', chamadaExterna.id);

      // 1. Validar dados da chamada externa
      this.validarChamadaExterna(chamadaExterna);

      // 2. Criar registro na central de chamadas
      const centralChamada = db.create('centralChamadas', {
        nomeChamador: chamadaExterna.caller_name || 'Não informado',
        telefoneChamador: chamadaExterna.caller_phone || 'Não informado',
        enderecoChamador: chamadaExterna.caller_address || 'Não informado',
        dataHoraChamada: chamadaExterna.timestamp || new Date().toISOString(),
        observacoes: chamadaExterna.notes || '',
        sistemaOrigem: chamadaExterna.system_id || 'SISTEMA_EXTERNO',
        protocoloExterno: chamadaExterna.external_protocol
      });

      // 3. Converter para formato interno de ocorrência
      const ocorrenciaData = this.converterParaOcorrencia(chamadaExterna, centralChamada.id);

      // 4. Processar através do fluxo principal
      const ocorrencia = await FluxoOcorrenciaService.processarNovaOcorrencia(ocorrenciaData);

      // 5. Log da integração
      db.create('logs', {
        tipo: 'INTEGRACAO_CHAMADA_EXTERNA',
        protocoloExterno: chamadaExterna.external_protocol,
        protocoloInterno: ocorrencia.protocolo,
        sistemaOrigem: chamadaExterna.system_id,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Chamada externa convertida: ${chamadaExterna.external_protocol} → ${ocorrencia.protocolo}`);

      return {
        success: true,
        ocorrencia,
        centralChamada,
        protocoloInterno: ocorrencia.protocolo,
        protocoloExterno: chamadaExterna.external_protocol
      };

    } catch (error) {
      console.error('❌ Erro ao processar chamada externa:', error);
      
      // Log do erro
      db.create('logs', {
        tipo: 'ERRO_INTEGRACAO_CHAMADA',
        protocoloExterno: chamadaExterna?.external_protocol,
        erro: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Valida os dados obrigatórios da chamada externa
   * @param {Object} chamadaExterna - Dados da chamada
   */
  validarChamadaExterna(chamadaExterna) {
    const camposObrigatorios = [
      'external_protocol',
      'incident_type',
      'description',
      'location',
      'latitude',
      'longitude'
    ];

    for (const campo of camposObrigatorios) {
      if (!chamadaExterna[campo]) {
        throw new Error(`Campo obrigatório ausente: ${campo}`);
      }
    }

    // Validar coordenadas
    const lat = parseFloat(chamadaExterna.latitude);
    const lng = parseFloat(chamadaExterna.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Coordenadas inválidas');
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Coordenadas fora do range válido');
    }
  }

  /**
   * Converte dados externos para formato interno
   * @param {Object} chamadaExterna - Dados externos
   * @param {string} centralChamadasId - ID da central de chamadas
   * @returns {Object} - Dados no formato interno
   */
  converterParaOcorrencia(chamadaExterna, centralChamadasId) {
    // Mapeamento de tipos de ocorrência
    const tipoMapping = {
      'ROBBERY': 'Assalto',
      'THEFT': 'Furto',
      'TRAFFIC_ACCIDENT': 'Acidente de Trânsito',
      'DOMESTIC_VIOLENCE': 'Violência Doméstica',
      'HOMICIDE': 'Homicídio',
      'DRUG_TRAFFICKING': 'Tráfico de Drogas',
      'VANDALISM': 'Vandalismo',
      'DISTURBANCE': 'Perturbação da Ordem'
    };

    return {
      tipo: tipoMapping[chamadaExterna.incident_type] || chamadaExterna.incident_type,
      descricao: chamadaExterna.description,
      localizacao: chamadaExterna.location,
      latitude: parseFloat(chamadaExterna.latitude),
      longitude: parseFloat(chamadaExterna.longitude),
      centralChamadasId,
      prioridade: chamadaExterna.priority || 'MEDIA',
      observacoes: chamadaExterna.additional_info || ''
    };
  }

  /**
   * Envia confirmação de recebimento para sistema externo
   * @param {string} protocoloExterno - Protocolo da chamada externa
   * @param {string} protocoloInterno - Protocolo interno gerado
   * @param {string} status - Status do processamento
   */
  async enviarConfirmacao(protocoloExterno, protocoloInterno, status = 'RECEIVED') {
    try {
      // Simular envio de confirmação para sistema externo
      const confirmacao = {
        external_protocol: protocoloExterno,
        internal_protocol: protocoloInterno,
        status: status,
        timestamp: new Date().toISOString(),
        system_id: 'SIAO'
      };

      // Log da confirmação
      db.create('logs', {
        tipo: 'CONFIRMACAO_ENVIADA',
        protocoloExterno,
        protocoloInterno,
        status,
        timestamp: new Date().toISOString()
      });

      console.log(`📤 Confirmação enviada: ${protocoloExterno} → ${status}`);
      return confirmacao;

    } catch (error) {
      console.error('❌ Erro ao enviar confirmação:', error);
      throw error;
    }
  }

  /**
   * Busca chamadas pendentes no sistema externo
   * @returns {Array} - Lista de chamadas pendentes
   */
  async buscarChamadasPendentes() {
    try {
      // Simular busca de chamadas pendentes
      // Em produção, faria requisição HTTP para sistema externo
      
      const chamadasMockadas = [
        {
          external_protocol: 'EXT-2025-001',
          incident_type: 'ROBBERY',
          description: 'Assalto em andamento na loja',
          location: 'Rua Comercial, 123 - Centro',
          latitude: -19.9200,
          longitude: -43.9400,
          caller_name: 'Lojista',
          caller_phone: '(31) 99999-9999',
          priority: 'HIGH',
          timestamp: new Date().toISOString()
        }
      ];

      return chamadasMockadas;

    } catch (error) {
      console.error('❌ Erro ao buscar chamadas pendentes:', error);
      throw error;
    }
  }

  /**
   * Processa chamadas em lote
   * @param {Array} chamadas - Lista de chamadas
   * @returns {Object} - Resultado do processamento
   */
  async processarLoteChamadas(chamadas) {
    const resultados = {
      total: chamadas.length,
      sucessos: 0,
      erros: 0,
      detalhes: []
    };

    for (const chamada of chamadas) {
      try {
        const resultado = await this.receberChamadaExterna(chamada);
        resultados.sucessos++;
        resultados.detalhes.push({
          protocoloExterno: chamada.external_protocol,
          protocoloInterno: resultado.ocorrencia.protocolo,
          status: 'SUCCESS'
        });
      } catch (error) {
        resultados.erros++;
        resultados.detalhes.push({
          protocoloExterno: chamada.external_protocol,
          status: 'ERROR',
          erro: error.message
        });
      }
    }

    console.log(`📊 Lote processado: ${resultados.sucessos} sucessos, ${resultados.erros} erros`);
    return resultados;
  }
}

module.exports = new ChamadasAdapter();