/**
 * Componente: Gerenciamento de Ocorrências
 * Interfaces: Irecebimento, Iconsulta, Iregistro
 * Componente central do backend para gerenciar ocorrências
 */

const db = require('../../database/jsonDatabase');
const stateMachine = require('../../services/OcorrenciaStateMachine');
const GeoService = require('../../services/GeolocalizacaoService');

class OcorrenciaManager {

  /**
   * Interface Irecebimento - Recebe e processa novas ocorrências
   */
  async receberOcorrencia(dadosOcorrencia, origem = 'MANUAL') {
    try {
      console.log(`📝 Recebendo ocorrência de origem: ${origem}`);

      // Validar dados obrigatórios
      this.validarDadosOcorrencia(dadosOcorrencia);

      // Gerar protocolo único
      const protocolo = await this.gerarProtocolo();

      // Determinar órgão responsável baseado no tipo
      const orgaoResponsavel = await this.determinarOrgaoResponsavel(dadosOcorrencia.tipo);

      // Criar ocorrência com estado inicial
      const ocorrencia = db.create('ocorrencias', {
        protocolo,
        tipo: dadosOcorrencia.tipo,
        descricao: dadosOcorrencia.descricao,
        localizacao: dadosOcorrencia.localizacao,
        latitude: parseFloat(dadosOcorrencia.latitude),
        longitude: parseFloat(dadosOcorrencia.longitude),
        status: stateMachine.states.INICIAL,
        dataHoraRegistro: new Date().toISOString(),
        dataHoraEncerramento: null,
        orgaoId: orgaoResponsavel.id,
        centralChamadasId: dadosOcorrencia.centralChamadasId,
        prioridade: dadosOcorrencia.prioridade || 'MEDIA',
        observacoes: dadosOcorrencia.observacoes || '',
        origem: origem,
        ultimaTransicao: new Date().toISOString()
      });

      // Transição automática para "Ocorrência aberta"
      stateMachine.transition(
        ocorrencia.id, 
        stateMachine.states.OCORRENCIA_ABERTA,
        `Ocorrência registrada via ${origem}`
      );

      // Log de recebimento
      db.create('logs', {
        tipo: 'OCORRENCIA_RECEBIDA',
        ocorrenciaId: ocorrencia.id,
        protocolo: ocorrencia.protocolo,
        origem: origem,
        orgaoId: orgaoResponsavel.id,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Ocorrência recebida: ${protocolo}`);
      return ocorrencia;

    } catch (error) {
      console.error('❌ Erro ao receber ocorrência:', error);
      throw error;
    }
  }

  /**
   * Interface Iconsulta - Consulta ocorrências com filtros avançados
   */
  async consultarOcorrencias(filtros = {}) {
    try {
      let ocorrencias = db.findAll('ocorrencias');

      // Aplicar filtros
      if (filtros.status) {
        ocorrencias = ocorrencias.filter(o => o.status === filtros.status);
      }

      if (filtros.tipo) {
        ocorrencias = ocorrencias.filter(o => 
          o.tipo.toLowerCase().includes(filtros.tipo.toLowerCase())
        );
      }

      if (filtros.orgaoId) {
        ocorrencias = ocorrencias.filter(o => o.orgaoId === filtros.orgaoId);
      }

      if (filtros.prioridade) {
        ocorrencias = ocorrencias.filter(o => o.prioridade === filtros.prioridade);
      }

      if (filtros.dataInicio && filtros.dataFim) {
        const inicio = new Date(filtros.dataInicio);
        const fim = new Date(filtros.dataFim);
        ocorrencias = ocorrencias.filter(o => {
          const data = new Date(o.dataHoraRegistro);
          return data >= inicio && data <= fim;
        });
      }

      if (filtros.raioKm && filtros.latitudeCentro && filtros.longitudeCentro) {
        ocorrencias = ocorrencias.filter(o => {
          const distancia = this.calcularDistancia(
            filtros.latitudeCentro,
            filtros.longitudeCentro,
            o.latitude,
            o.longitude
          );
          return distancia <= filtros.raioKm;
        });
      }

      // Enriquecer com dados relacionados
      const ocorrenciasDetalhadas = await Promise.all(
        ocorrencias.map(async (o) => await this.enriquecerOcorrencia(o))
      );

      // Ordenar por data (mais recentes primeiro)
      ocorrenciasDetalhadas.sort((a, b) => 
        new Date(b.dataHoraRegistro) - new Date(a.dataHoraRegistro)
      );

      return {
        ocorrencias: ocorrenciasDetalhadas,
        total: ocorrenciasDetalhadas.length,
        filtros: filtros
      };

    } catch (error) {
      console.error('❌ Erro ao consultar ocorrências:', error);
      throw error;
    }
  }

  /**
   * Interface Iregistro - Registra atualizações e ações nas ocorrências
   */
  async registrarAtualizacao(ocorrenciaId, tipoAtualizacao, dados, usuarioId) {
    try {
      const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
      if (!ocorrencia) {
        throw new Error('Ocorrência não encontrada');
      }

      let resultado;

      switch (tipoAtualizacao) {
        case 'TRANSICAO_ESTADO':
          resultado = await this.registrarTransicaoEstado(ocorrenciaId, dados.novoEstado, dados.observacoes);
          break;

        case 'ADICIONAR_OBSERVACAO':
          resultado = await this.adicionarObservacao(ocorrenciaId, dados.observacao, usuarioId);
          break;

        case 'ATUALIZAR_PRIORIDADE':
          resultado = await this.atualizarPrioridade(ocorrenciaId, dados.novaPrioridade, usuarioId);
          break;

        case 'ADICIONAR_EVIDENCIA':
          resultado = await this.adicionarEvidencia(ocorrenciaId, dados.evidencia, usuarioId);
          break;

        default:
          throw new Error(`Tipo de atualização não suportado: ${tipoAtualizacao}`);
      }

      // Log da atualização
      db.create('logs', {
        tipo: 'ATUALIZACAO_OCORRENCIA',
        ocorrenciaId,
        tipoAtualizacao,
        usuarioId,
        timestamp: new Date().toISOString()
      });

      return resultado;

    } catch (error) {
      console.error('❌ Erro ao registrar atualização:', error);
      throw error;
    }
  }

  /**
   * Busca ocorrências próximas a uma localização
   */
  async buscarOcorrenciasProximas(latitude, longitude, raioKm = 5) {
    try {
      const ocorrencias = db.findAll('ocorrencias').filter(o => 
        o.status !== stateMachine.states.FINALIZADA
      );

      const ocorrenciasProximas = ocorrencias
        .map(o => ({
          ...o,
          distancia: this.calcularDistancia(latitude, longitude, o.latitude, o.longitude)
        }))
        .filter(o => o.distancia <= raioKm)
        .sort((a, b) => a.distancia - b.distancia);

      return ocorrenciasProximas;

    } catch (error) {
      console.error('❌ Erro ao buscar ocorrências próximas:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das ocorrências
   */
  async obterEstatisticas(periodo = '24h') {
    try {
      const agora = new Date();
      let dataInicio;

      switch (periodo) {
        case '1h':
          dataInicio = new Date(agora.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          dataInicio = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dataInicio = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
      }

      const ocorrencias = db.findAll('ocorrencias').filter(o => 
        new Date(o.dataHoraRegistro) >= dataInicio
      );

      const estatisticas = {
        periodo,
        total: ocorrencias.length,
        porStatus: this.agruparPorCampo(ocorrencias, 'status'),
        porTipo: this.agruparPorCampo(ocorrencias, 'tipo'),
        porPrioridade: this.agruparPorCampo(ocorrencias, 'prioridade'),
        porOrgao: this.agruparPorOrgao(ocorrencias),
        tempoMedioAtendimento: this.calcularTempoMedioAtendimento(ocorrencias),
        ocorrenciasAbertas: ocorrencias.filter(o => o.status !== stateMachine.states.FINALIZADA).length,
        ocorrenciasFinalizadas: ocorrencias.filter(o => o.status === stateMachine.states.FINALIZADA).length
      };

      return estatisticas;

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  validarDadosOcorrencia(dados) {
    const camposObrigatorios = ['tipo', 'descricao', 'localizacao', 'latitude', 'longitude'];
    
    for (const campo of camposObrigatorios) {
      if (!dados[campo]) {
        throw new Error(`Campo obrigatório ausente: ${campo}`);
      }
    }

    const lat = parseFloat(dados.latitude);
    const lng = parseFloat(dados.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Coordenadas inválidas');
    }
  }

  async gerarProtocolo() {
    const ano = new Date().getFullYear();
    const ocorrencias = db.findAll('ocorrencias');
    
    const ocorrenciasAno = ocorrencias.filter(o => 
      o.protocolo && o.protocolo.startsWith(`OC-${ano}`)
    );
    
    const numero = ocorrenciasAno.length + 1;
    return `OC-${ano}-${String(numero).padStart(5, '0')}`;
  }

  async determinarOrgaoResponsavel(tipo) {
    const orgaos = db.findAll('orgaos');
    
    // RN02: Homicídios vão para DHPP
    if (tipo.toLowerCase().includes('homicídio') || tipo.toLowerCase().includes('homicidio')) {
      return orgaos.find(o => o.sigla === 'DHPP');
    }
    
    return orgaos.find(o => o.sigla === 'PMMG');
  }

  async enriquecerOcorrencia(ocorrencia) {
    const centralChamada = db.findById('centralChamadas', ocorrencia.centralChamadasId);
    const orgao = db.findById('orgaos', ocorrencia.orgaoId);
    const despachos = db.findAll('despachos').filter(d => d.ocorrenciaId === ocorrencia.id);
    const reforcosPolicia = db.findAll('reforcosPolicia').filter(r => r.ocorrenciaId === ocorrencia.id);
    const historicoTransicoes = stateMachine.getTransitionHistory(ocorrencia.id);

    return {
      ...ocorrencia,
      centralChamada,
      orgao,
      despachos,
      reforcosPolicia,
      historicoTransicoes,
      transicoesDisponiveis: stateMachine.getAvailableTransitions(ocorrencia.status)
    };
  }

  async registrarTransicaoEstado(ocorrenciaId, novoEstado, observacoes) {
    return stateMachine.transition(ocorrenciaId, novoEstado, observacoes);
  }

  async adicionarObservacao(ocorrenciaId, observacao, usuarioId) {
    const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
    const observacaoAtual = ocorrencia.observacoes || '';
    const novaObservacao = `${observacaoAtual}\n[${new Date().toISOString()}] ${observacao}`.trim();
    
    return db.update('ocorrencias', ocorrenciaId, { observacoes: novaObservacao });
  }

  async atualizarPrioridade(ocorrenciaId, novaPrioridade, usuarioId) {
    return db.update('ocorrencias', ocorrenciaId, { prioridade: novaPrioridade });
  }

  async adicionarEvidencia(ocorrenciaId, evidencia, usuarioId) {
    // Implementar lógica de evidências (fotos, documentos, etc.)
    db.create('logs', {
      tipo: 'EVIDENCIA_ADICIONADA',
      ocorrenciaId,
      evidencia,
      usuarioId,
      timestamp: new Date().toISOString()
    });
  }

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

  agruparPorCampo(ocorrencias, campo) {
    return ocorrencias.reduce((acc, o) => {
      const valor = o[campo] || 'Não informado';
      acc[valor] = (acc[valor] || 0) + 1;
      return acc;
    }, {});
  }

  agruparPorOrgao(ocorrencias) {
    const orgaos = db.findAll('orgaos');
    return ocorrencias.reduce((acc, o) => {
      const orgao = orgaos.find(org => org.id === o.orgaoId);
      const nomeOrgao = orgao ? orgao.sigla : 'Não informado';
      acc[nomeOrgao] = (acc[nomeOrgao] || 0) + 1;
      return acc;
    }, {});
  }

  calcularTempoMedioAtendimento(ocorrencias) {
    const finalizadas = ocorrencias.filter(o => 
      o.status === stateMachine.states.FINALIZADA && o.dataHoraEncerramento
    );

    if (finalizadas.length === 0) return 0;

    const tempoTotal = finalizadas.reduce((acc, o) => {
      const inicio = new Date(o.dataHoraRegistro);
      const fim = new Date(o.dataHoraEncerramento);
      return acc + (fim - inicio);
    }, 0);

    return Math.round(tempoTotal / finalizadas.length / (1000 * 60)); // em minutos
  }
}

module.exports = new OcorrenciaManager();