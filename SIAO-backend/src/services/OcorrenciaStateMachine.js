const db = require('../database/jsonDatabase');

/**
 * Máquina de Estados para Ocorrências
 * Baseada no diagrama de estados: Inicial → Ocorrência aberta → Viatura Solicitada → Despachada → Em Atendimento → Final
 */
class OcorrenciaStateMachine {
  constructor() {
    this.states = {
      INICIAL: 'Inicial',
      OCORRENCIA_ABERTA: 'Ocorrência aberta',
      VIATURA_SOLICITADA: 'Viatura Solicitada',
      DESPACHADA: 'Despachada',
      EM_ATENDIMENTO: 'Em Atendimento',
      FINALIZADA: 'Finalizada'
    };

    // Definir transições válidas entre estados
    this.transitions = {
      [this.states.INICIAL]: [this.states.OCORRENCIA_ABERTA],
      [this.states.OCORRENCIA_ABERTA]: [this.states.VIATURA_SOLICITADA],
      [this.states.VIATURA_SOLICITADA]: [this.states.DESPACHADA],
      [this.states.DESPACHADA]: [this.states.EM_ATENDIMENTO],
      [this.states.EM_ATENDIMENTO]: [this.states.FINALIZADA]
    };
  }

  /**
   * Verifica se uma transição de estado é válida
   * @param {string} currentState - Estado atual
   * @param {string} newState - Novo estado desejado
   * @returns {boolean} - True se a transição é válida
   */
  canTransition(currentState, newState) {
    const allowedTransitions = this.transitions[currentState] || [];
    return allowedTransitions.includes(newState);
  }

  /**
   * Executa uma transição de estado
   * @param {string} ocorrenciaId - ID da ocorrência
   * @param {string} newState - Novo estado
   * @param {string} observacoes - Observações da transição (opcional)
   * @returns {Object} - Ocorrência atualizada
   */
  transition(ocorrenciaId, newState, observacoes = null) {
    const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
    
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada');
    }

    if (!this.canTransition(ocorrencia.status, newState)) {
      throw new Error(`Transição inválida de "${ocorrencia.status}" para "${newState}"`);
    }

    // Log da transição
    db.create('logs', {
      tipo: 'TRANSICAO_ESTADO',
      ocorrenciaId,
      estadoAnterior: ocorrencia.status,
      novoEstado: newState,
      observacoes,
      timestamp: new Date().toISOString()
    });

    // Atualizar ocorrência
    const ocorrenciaAtualizada = db.update('ocorrencias', ocorrenciaId, { 
      status: newState,
      ultimaTransicao: new Date().toISOString()
    });

    return ocorrenciaAtualizada;
  }

  /**
   * Obtém as transições disponíveis para um estado atual
   * @param {string} currentState - Estado atual
   * @returns {Array} - Lista de estados possíveis
   */
  getAvailableTransitions(currentState) {
    return this.transitions[currentState] || [];
  }

  /**
   * Verifica se uma ocorrência pode ser finalizada
   * @param {string} ocorrenciaId - ID da ocorrência
   * @returns {boolean} - True se pode ser finalizada
   */
  canFinalize(ocorrenciaId) {
    const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
    
    if (!ocorrencia) {
      return false;
    }

    // RN05: Verificar se há ações registradas antes de finalizar
    const despachos = db.findAll('despachos').filter(d => d.ocorrenciaId === ocorrenciaId);
    const temAcoes = despachos.some(d => d.acoes && d.acoes.trim().length > 0);

    return ocorrencia.status === this.states.EM_ATENDIMENTO && temAcoes;
  }

  /**
   * Obtém histórico de transições de uma ocorrência
   * @param {string} ocorrenciaId - ID da ocorrência
   * @returns {Array} - Histórico de transições
   */
  getTransitionHistory(ocorrenciaId) {
    const logs = db.findAll('logs').filter(log => 
      log.tipo === 'TRANSICAO_ESTADO' && log.ocorrenciaId === ocorrenciaId
    );

    return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
}

module.exports = new OcorrenciaStateMachine();