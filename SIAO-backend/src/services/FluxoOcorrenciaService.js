const db = require('../database/jsonDatabase');
const stateMachine = require('./OcorrenciaStateMachine');
const GeoService = require('./GeolocalizacaoService');

/**
 * Serviço principal para gerenciar o fluxo completo de ocorrências
 * Implementa os casos de uso CSU01 e CSU02 conforme diagramas UML
 */
class FluxoOcorrenciaService {
  
  /**
   * CSU01 - Receber ocorrência
   * Processa uma nova ocorrência e determina o fluxo baseado no tipo
   * @param {Object} ocorrenciaData - Dados da ocorrência
   * @returns {Object} - Ocorrência criada
   */
  async processarNovaOcorrencia(ocorrenciaData) {
    try {
      // 1. Gerar protocolo
      const protocolo = await this.gerarProtocolo();
      
      // 2. Criar ocorrência com estado inicial
      const ocorrencia = db.create('ocorrencias', {
        ...ocorrenciaData,
        protocolo,
        status: stateMachine.states.INICIAL,
        dataHoraRegistro: new Date().toISOString(),
        dataHoraEncerramento: null
      });

      // 3. Transição para "Ocorrência aberta"
      stateMachine.transition(ocorrencia.id, stateMachine.states.OCORRENCIA_ABERTA, 'Ocorrência registrada no sistema');

      // 4. Verificar tipo e encaminhar
      const ehHomicidio = this.verificarSeEhHomicidio(ocorrencia.tipo);
      
      let orgao;
      if (ehHomicidio) {
        orgao = db.findOne('orgaos', { sigla: 'DHPP' });
        await this.encaminharParaDHPP(ocorrencia);
      } else {
        orgao = db.findOne('orgaos', { sigla: 'PMMG' });
        await this.encaminharParaPM(ocorrencia);
      }

      // 5. Atualizar ocorrência com órgão responsável
      const ocorrenciaAtualizada = db.update('ocorrencias', ocorrencia.id, { 
        orgaoId: orgao.id 
      });

      // 6. Log para central de informações
      db.create('logs', {
        tipo: 'NOVA_OCORRENCIA',
        ocorrenciaId: ocorrencia.id,
        orgaoId: orgao.id,
        protocolo: ocorrencia.protocolo,
        timestamp: new Date().toISOString()
      });

      return ocorrenciaAtualizada;
    } catch (error) {
      console.error('Erro ao processar nova ocorrência:', error);
      throw error;
    }
  }

  /**
   * CSU01.1 - Atender ocorrência
   * Inicia o atendimento de uma ocorrência
   * @param {string} ocorrenciaId - ID da ocorrência
   * @param {string} policialId - ID do policial
   * @returns {Object} - Ocorrência atualizada
   */
  async iniciarAtendimento(ocorrenciaId, policialId) {
    try {
      // Verificar se ocorrência existe e está despachada
      const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
      if (!ocorrencia) {
        throw new Error('Ocorrência não encontrada');
      }

      if (ocorrencia.status !== stateMachine.states.DESPACHADA) {
        throw new Error('Ocorrência deve estar despachada para iniciar atendimento');
      }

      // Transição para "Em Atendimento"
      const ocorrenciaAtualizada = stateMachine.transition(
        ocorrenciaId, 
        stateMachine.states.EM_ATENDIMENTO,
        `Atendimento iniciado pelo policial ${policialId}`
      );

      // Atualizar despacho relacionado
      const despacho = db.findOne('despachos', { ocorrenciaId });
      if (despacho) {
        db.update('despachos', despacho.id, {
          status: 'Em Atendimento',
          dataHoraInicioAtendimento: new Date().toISOString()
        });
      }

      return ocorrenciaAtualizada;
    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error);
      throw error;
    }
  }

  /**
   * CSU01.2 - Solicitar equipe DHPP
   * @param {string} ocorrenciaId - ID da ocorrência
   * @param {string} solicitadoPor - ID do usuário solicitante
   * @returns {Object} - Solicitação criada
   */
  async solicitarEquipeDHPP(ocorrenciaId, solicitadoPor) {
    try {
      const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
      if (!ocorrencia) {
        throw new Error('Ocorrência não encontrada');
      }

      // Criar solicitação
      const solicitacao = db.create('logs', {
        tipo: 'SOLICITACAO_DHPP',
        ocorrenciaId,
        solicitadoPor,
        status: 'Pendente',
        timestamp: new Date().toISOString()
      });

      // Notificar DHPP via WebSocket (será implementado no controller)
      return solicitacao;
    } catch (error) {
      console.error('Erro ao solicitar equipe DHPP:', error);
      throw error;
    }
  }

  /**
   * CSU01.3 - Chamar reforço policial
   * @param {string} ocorrenciaId - ID da ocorrência
   * @param {string} policialId - ID do policial solicitante
   * @param {number} nivelUrgencia - Nível de urgência (1-5)
   * @returns {Object} - Reforço criado
   */
  async solicitarReforco(ocorrenciaId, policialId, nivelUrgencia) {
    try {
      const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
      if (!ocorrencia) {
        throw new Error('Ocorrência não encontrada');
      }

      // Validar nível de urgência
      if (nivelUrgencia < 1 || nivelUrgencia > 5) {
        throw new Error('Nível de urgência deve estar entre 1 e 5');
      }

      const reforco = db.create('reforcosPolicia', {
        ocorrenciaId,
        solicitadoPor: policialId,
        nivelUrgencia,
        dataHoraSolicitacao: new Date().toISOString(),
        status: 'Pendente'
      });

      // Log para central de informações
      db.create('logs', {
        tipo: 'REFORCO_SOLICITADO',
        ocorrenciaId,
        reforcoId: reforco.id,
        nivelUrgencia,
        timestamp: new Date().toISOString()
      });

      return reforco;
    } catch (error) {
      console.error('Erro ao solicitar reforço:', error);
      throw error;
    }
  }

  /**
   * CSU01.4 - Finalizar atendimento
   * @param {string} despachoId - ID do despacho
   * @param {string} acoes - Ações realizadas
   * @returns {Object} - Resultado da finalização
   */
  async finalizarAtendimento(despachoId, acoes) {
    try {
      // RN05: Validar se ações foram registradas
      if (!acoes || acoes.trim().length === 0) {
        throw new Error('É necessário registrar as ações realizadas antes de finalizar');
      }

      const despacho = db.findById('despachos', despachoId);
      if (!despacho) {
        throw new Error('Despacho não encontrado');
      }

      const ocorrencia = db.findById('ocorrencias', despacho.ocorrenciaId);
      if (!ocorrencia) {
        throw new Error('Ocorrência não encontrada');
      }

      // Verificar se pode finalizar
      if (!stateMachine.canFinalize(ocorrencia.id)) {
        throw new Error('Ocorrência não pode ser finalizada no estado atual');
      }

      // Atualizar despacho
      const despachoAtualizado = db.update('despachos', despachoId, {
        status: 'Concluída',
        acoes,
        dataHoraConclusao: new Date().toISOString()
      });

      // Finalizar ocorrência
      const ocorrenciaFinalizada = stateMachine.transition(
        ocorrencia.id, 
        stateMachine.states.FINALIZADA,
        'Atendimento finalizado com sucesso'
      );

      // Atualizar data de encerramento
      db.update('ocorrencias', ocorrencia.id, {
        dataHoraEncerramento: new Date().toISOString()
      });

      // Log para central de informações
      db.create('logs', {
        tipo: 'FINALIZACAO_ATENDIMENTO',
        despachoId,
        ocorrenciaId: ocorrencia.id,
        timestamp: new Date().toISOString()
      });

      return { 
        despacho: despachoAtualizado, 
        ocorrencia: ocorrenciaFinalizada 
      };
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      throw error;
    }
  }

  /**
   * CSU01.1.1 - Consultar ocorrência
   * @param {string} ocorrenciaId - ID da ocorrência
   * @returns {Object} - Ocorrência com detalhes completos
   */
  async consultarOcorrencia(ocorrenciaId) {
    try {
      const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
      if (!ocorrencia) {
        throw new Error('Ocorrência não encontrada');
      }

      // Buscar dados relacionados
      const centralChamada = db.findById('centralChamadas', ocorrencia.centralChamadasId);
      const orgao = db.findById('orgaos', ocorrencia.orgaoId);
      const despachos = db.findAll('despachos').filter(d => d.ocorrenciaId === ocorrenciaId);
      const historicoTransicoes = stateMachine.getTransitionHistory(ocorrenciaId);
      const reforcosPolicia = db.findAll('reforcosPolicia').filter(r => r.ocorrenciaId === ocorrenciaId);

      return {
        ...ocorrencia,
        centralChamada,
        orgao,
        despachos,
        historicoTransicoes,
        reforcosPolicia,
        transicoesDisponiveis: stateMachine.getAvailableTransitions(ocorrencia.status)
      };
    } catch (error) {
      console.error('Erro ao consultar ocorrência:', error);
      throw error;
    }
  }

  /**
   * CSU01.1.2 - Registrar detalhes do atendimento
   * @param {string} despachoId - ID do despacho
   * @param {string} detalhes - Detalhes do atendimento
   * @returns {Object} - Despacho atualizado
   */
  async registrarDetalhesAtendimento(despachoId, detalhes) {
    try {
      const despacho = db.findById('despachos', despachoId);
      if (!despacho) {
        throw new Error('Despacho não encontrado');
      }

      const despachoAtualizado = db.update('despachos', despachoId, {
        observacoes: detalhes,
        ultimaAtualizacao: new Date().toISOString()
      });

      // Log da atualização
      db.create('logs', {
        tipo: 'DETALHES_ATENDIMENTO',
        despachoId,
        ocorrenciaId: despacho.ocorrenciaId,
        timestamp: new Date().toISOString()
      });

      return despachoAtualizada;
    } catch (error) {
      console.error('Erro ao registrar detalhes:', error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Gera protocolo único para ocorrência
   * @returns {string} - Protocolo no formato OC-YYYY-NNNNN
   */
  async gerarProtocolo() {
    const ano = new Date().getFullYear();
    const ocorrencias = db.findAll('ocorrencias');
    
    const ocorrenciasAno = ocorrencias.filter(o => 
      o.protocolo && o.protocolo.startsWith(`OC-${ano}`)
    );
    
    const numero = ocorrenciasAno.length + 1;
    return `OC-${ano}-${String(numero).padStart(5, '0')}`;
  }

  /**
   * RN02: Verifica se ocorrência é de homicídio
   * @param {string} tipo - Tipo da ocorrência
   * @returns {boolean} - True se for homicídio
   */
  verificarSeEhHomicidio(tipo) {
    const palavrasChave = ['homicídio', 'homicidio', 'assassinato', 'morte', 'óbito'];
    return palavrasChave.some(palavra =>
      tipo.toLowerCase().includes(palavra)
    );
  }

  /**
   * Encaminha ocorrência para DHPP
   * @param {Object} ocorrencia - Dados da ocorrência
   */
  async encaminharParaDHPP(ocorrencia) {
    console.log(`Ocorrência ${ocorrencia.protocolo} encaminhada ao DHPP`);
    
    // Log do encaminhamento
    db.create('logs', {
      tipo: 'ENCAMINHAMENTO_DHPP',
      ocorrenciaId: ocorrencia.id,
      protocolo: ocorrencia.protocolo,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Encaminha ocorrência para PM e localiza viatura
   * @param {Object} ocorrencia - Dados da ocorrência
   */
  async encaminharParaPM(ocorrencia) {
    console.log(`Ocorrência ${ocorrencia.protocolo} encaminhada à PM`);
    
    try {
      // RN04: Localizar viatura mais próxima
      const viaturasProximas = await GeoService.encontrarViaturasProximas(
        ocorrencia.latitude,
        ocorrencia.longitude,
        10 // raio de 10km
      );

      if (viaturasProximas.length > 0) {
        const viaturaMaisProxima = viaturasProximas[0];
        
        // RN03: Verificar se viatura está disponível
        if (viaturaMaisProxima.status === 'Disponível') {
          // Criar despacho
          const despacho = db.create('despachos', {
            ocorrenciaId: ocorrencia.id,
            viaturaId: viaturaMaisProxima.id,
            status: 'Enviada',
            dataHoraDespacho: new Date().toISOString(),
            distanciaKm: viaturaMaisProxima.distancia
          });

          // Transição para "Viatura Solicitada"
          stateMachine.transition(
            ocorrencia.id, 
            stateMachine.states.VIATURA_SOLICITADA,
            `Viatura ${viaturaMaisProxima.prefixo} solicitada`
          );

          // Depois para "Despachada"
          stateMachine.transition(
            ocorrencia.id, 
            stateMachine.states.DESPACHADA,
            `Viatura ${viaturaMaisProxima.prefixo} despachada`
          );

          // Atualizar status da viatura
          db.update('viaturas', viaturaMaisProxima.id, {
            status: 'Em Deslocamento'
          });

          return despacho;
        }
      }
      
      // Se não encontrou viatura disponível, apenas transiciona para "Viatura Solicitada"
      stateMachine.transition(
        ocorrencia.id, 
        stateMachine.states.VIATURA_SOLICITADA,
        'Aguardando viatura disponível'
      );

    } catch (error) {
      console.error('Erro ao encaminhar para PM:', error);
      // Mesmo com erro, registra que foi encaminhado
      stateMachine.transition(
        ocorrencia.id, 
        stateMachine.states.VIATURA_SOLICITADA,
        'Encaminhado para PM - erro na localização de viatura'
      );
    }
  }
}

module.exports = new FluxoOcorrenciaService();