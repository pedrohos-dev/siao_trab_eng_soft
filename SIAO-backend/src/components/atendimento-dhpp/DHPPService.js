/**
 * Componente: Atendimento DHPP
 * Interface: IsolicitacaoDHPP
 * Módulo especializado para casos de homicídio
 */

const db = require('../../database/jsonDatabase');
const stateMachine = require('../../services/OcorrenciaStateMachine');
const GeoService = require('../../services/GeolocalizacaoService');

class DHPPService {

  /**
   * Processa ocorrências específicas do DHPP (homicídios)
   */
  async processarOcorrenciaDHPP(ocorrenciaId) {
    try {
      const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
      
      if (!ocorrencia) {
        throw new Error('Ocorrência não encontrada');
      }

      // Verificar se é realmente uma ocorrência do DHPP
      const orgaoDHPP = db.findOne('orgaos', { sigla: 'DHPP' });
      if (ocorrencia.orgaoId !== orgaoDHPP.id) {
        throw new Error('Ocorrência não pertence ao DHPP');
      }

      console.log(`🔍 Processando ocorrência DHPP: ${ocorrencia.protocolo}`);

      // Protocolo específico do DHPP
      await this.aplicarProtocoloHomicidio(ocorrencia);

      // Solicitar equipe especializada
      await this.solicitarEquipeEspecializada(ocorrencia);

      // Preservar local do crime
      await this.preservarLocalCrime(ocorrencia);

      // Log específico do DHPP
      db.create('logs', {
        tipo: 'PROCESSAMENTO_DHPP',
        ocorrenciaId: ocorrencia.id,
        protocolo: ocorrencia.protocolo,
        timestamp: new Date().toISOString()
      });

      return ocorrencia;

    } catch (error) {
      console.error('❌ Erro ao processar ocorrência DHPP:', error);
      throw error;
    }
  }

  /**
   * Solicita equipe especializada do DHPP
   */
  async solicitarEquipeEspecializada(ocorrencia) {
    try {
      // Determinar tipo de equipe necessária
      const tiposEquipe = this.determinarTipoEquipe(ocorrencia);

      for (const tipoEquipe of tiposEquipe) {
        const solicitacao = db.create('logs', {
          tipo: 'SOLICITACAO_EQUIPE_DHPP',
          ocorrenciaId: ocorrencia.id,
          tipoEquipe: tipoEquipe,
          status: 'SOLICITADA',
          prioridade: this.determinarPrioridadeEquipe(ocorrencia, tipoEquipe),
          timestamp: new Date().toISOString()
        });

        console.log(`👥 Equipe ${tipoEquipe} solicitada para ${ocorrencia.protocolo}`);
      }

      // Buscar viaturas DHPP disponíveis
      const viaturasDisponveis = await this.buscarViaturasDisponiveisDHPP(ocorrencia);
      
      if (viaturasDisponveis.length > 0) {
        await this.despacharViaturaDHPP(ocorrencia, viaturasDisponveis[0]);
      }

    } catch (error) {
      console.error('❌ Erro ao solicitar equipe DHPP:', error);
      throw error;
    }
  }

  /**
   * Preserva o local do crime
   */
  async preservarLocalCrime(ocorrencia) {
    try {
      // Criar perímetro de isolamento
      const perimetro = {
        centro: {
          latitude: ocorrencia.latitude,
          longitude: ocorrencia.longitude
        },
        raio: 100, // metros
        tipo: 'ISOLAMENTO_HOMICIDIO'
      };

      // Registrar preservação
      db.create('logs', {
        tipo: 'PRESERVACAO_LOCAL_CRIME',
        ocorrenciaId: ocorrencia.id,
        perimetro: JSON.stringify(perimetro),
        timestamp: new Date().toISOString()
      });

      // Notificar viaturas próximas sobre o isolamento
      const viaturasProximas = await GeoService.encontrarViaturasProximas(
        ocorrencia.latitude,
        ocorrencia.longitude,
        1 // 1km de raio
      );

      for (const viatura of viaturasProximas) {
        db.create('logs', {
          tipo: 'NOTIFICACAO_ISOLAMENTO',
          viaturaId: viatura.id,
          ocorrenciaId: ocorrencia.id,
          mensagem: 'Local de homicídio - manter distância de 100m',
          timestamp: new Date().toISOString()
        });
      }

      console.log(`🚧 Local do crime preservado: ${ocorrencia.protocolo}`);

    } catch (error) {
      console.error('❌ Erro ao preservar local:', error);
      throw error;
    }
  }

  /**
   * Aplica protocolo específico para homicídios
   */
  async aplicarProtocoloHomicidio(ocorrencia) {
    try {
      const protocolos = [
        'ISOLAMENTO_AREA',
        'ACIONAMENTO_PERICIA',
        'ACIONAMENTO_IML',
        'ACIONAMENTO_FOTOGRAFO',
        'COLETA_TESTEMUNHAS'
      ];

      for (const protocolo of protocolos) {
        db.create('logs', {
          tipo: 'PROTOCOLO_HOMICIDIO',
          ocorrenciaId: ocorrencia.id,
          protocolo: protocolo,
          status: 'PENDENTE',
          timestamp: new Date().toISOString()
        });
      }

      // Atualizar prioridade para ALTA
      db.update('ocorrencias', ocorrencia.id, {
        prioridade: 'ALTA',
        observacoes: (ocorrencia.observacoes || '') + '\n[DHPP] Protocolo de homicídio aplicado'
      });

      console.log(`📋 Protocolo de homicídio aplicado: ${ocorrencia.protocolo}`);

    } catch (error) {
      console.error('❌ Erro ao aplicar protocolo:', error);
      throw error;
    }
  }

  /**
   * Busca viaturas DHPP disponíveis
   */
  async buscarViaturasDisponiveisDHPP(ocorrencia) {
    try {
      const orgaoDHPP = db.findOne('orgaos', { sigla: 'DHPP' });
      const viaturas = db.findAll('viaturas').filter(v => 
        v.orgaoId === orgaoDHPP.id && v.status === 'Disponível'
      );

      // Calcular distâncias
      const viaturasComDistancia = await Promise.all(
        viaturas.map(async (viatura) => {
          const posicao = await GeoService.obterPosicaoViatura(viatura.id);
          if (posicao) {
            const distancia = this.calcularDistancia(
              ocorrencia.latitude,
              ocorrencia.longitude,
              posicao.latitude,
              posicao.longitude
            );
            return { ...viatura, distancia, posicao };
          }
          return { ...viatura, distancia: Infinity };
        })
      );

      // Ordenar por distância
      return viaturasComDistancia
        .filter(v => v.distancia !== Infinity)
        .sort((a, b) => a.distancia - b.distancia);

    } catch (error) {
      console.error('❌ Erro ao buscar viaturas DHPP:', error);
      return [];
    }
  }

  /**
   * Despacha viatura DHPP para ocorrência
   */
  async despacharViaturaDHPP(ocorrencia, viatura) {
    try {
      // Criar despacho
      const despacho = db.create('despachos', {
        ocorrenciaId: ocorrencia.id,
        viaturaId: viatura.id,
        dataHoraDespacho: new Date().toISOString(),
        status: 'Enviada',
        observacoes: 'Despacho DHPP - Homicídio',
        distanciaKm: viatura.distancia,
        tipoDespacho: 'DHPP_HOMICIDIO'
      });

      // Atualizar status da viatura
      db.update('viaturas', viatura.id, {
        status: 'Em Deslocamento'
      });

      // Transição de estado da ocorrência
      if (ocorrencia.status === stateMachine.states.VIATURA_SOLICITADA) {
        stateMachine.transition(
          ocorrencia.id,
          stateMachine.states.DESPACHADA,
          `Viatura DHPP ${viatura.prefixo} despachada`
        );
      }

      console.log(`🚔 Viatura DHPP ${viatura.prefixo} despachada para ${ocorrencia.protocolo}`);
      return despacho;

    } catch (error) {
      console.error('❌ Erro ao despachar viatura DHPP:', error);
      throw error;
    }
  }

  /**
   * Determina tipos de equipe necessários
   */
  determinarTipoEquipe(ocorrencia) {
    const equipesBase = ['INVESTIGADOR', 'PERITO_CRIMINAL'];
    
    // Adicionar equipes específicas baseadas na descrição
    const descricao = ocorrencia.descricao.toLowerCase();
    
    if (descricao.includes('arma de fogo') || descricao.includes('tiro')) {
      equipesBase.push('PERITO_BALISTICA');
    }
    
    if (descricao.includes('corpo') || descricao.includes('cadáver')) {
      equipesBase.push('MEDICO_LEGISTA');
    }
    
    equipesBase.push('FOTOGRAFO_CRIMINAL');
    
    return equipesBase;
  }

  /**
   * Determina prioridade da equipe
   */
  determinarPrioridadeEquipe(ocorrencia, tipoEquipe) {
    // Investigador e Perito têm prioridade alta
    if (['INVESTIGADOR', 'PERITO_CRIMINAL'].includes(tipoEquipe)) {
      return 'ALTA';
    }
    
    // Médico legista tem prioridade alta se há corpo
    if (tipoEquipe === 'MEDICO_LEGISTA') {
      return 'ALTA';
    }
    
    return 'MEDIA';
  }

  /**
   * Obtém estatísticas específicas do DHPP
   */
  async obterEstatisticasDHPP(periodo = '30d') {
    try {
      const agora = new Date();
      let dataInicio;

      switch (periodo) {
        case '7d':
          dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dataInicio = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const orgaoDHPP = db.findOne('orgaos', { sigla: 'DHPP' });
      const ocorrenciasDHPP = db.findAll('ocorrencias').filter(o => 
        o.orgaoId === orgaoDHPP.id && new Date(o.dataHoraRegistro) >= dataInicio
      );

      const estatisticas = {
        periodo,
        totalHomicidios: ocorrenciasDHPP.length,
        porStatus: this.agruparPorCampo(ocorrenciasDHPP, 'status'),
        equipesAcionadas: this.contarEquipesAcionadas(ocorrenciasDHPP),
        tempoMedioResposta: this.calcularTempoMedioResposta(ocorrenciasDHPP),
        locaisPreservados: this.contarLocaisPreservados(ocorrenciasDHPP),
        casosResolvidos: ocorrenciasDHPP.filter(o => o.status === stateMachine.states.FINALIZADA).length
      };

      return estatisticas;

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas DHPP:', error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
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

  contarEquipesAcionadas(ocorrencias) {
    const logs = db.findAll('logs').filter(log => 
      log.tipo === 'SOLICITACAO_EQUIPE_DHPP' &&
      ocorrencias.some(o => o.id === log.ocorrenciaId)
    );

    return logs.reduce((acc, log) => {
      acc[log.tipoEquipe] = (acc[log.tipoEquipe] || 0) + 1;
      return acc;
    }, {});
  }

  calcularTempoMedioResposta(ocorrencias) {
    const despachos = db.findAll('despachos').filter(d => 
      ocorrencias.some(o => o.id === d.ocorrenciaId)
    );

    if (despachos.length === 0) return 0;

    const tempoTotal = despachos.reduce((acc, d) => {
      const ocorrencia = ocorrencias.find(o => o.id === d.ocorrenciaId);
      if (ocorrencia) {
        const inicio = new Date(ocorrencia.dataHoraRegistro);
        const despacho = new Date(d.dataHoraDespacho);
        return acc + (despacho - inicio);
      }
      return acc;
    }, 0);

    return Math.round(tempoTotal / despachos.length / (1000 * 60)); // em minutos
  }

  contarLocaisPreservados(ocorrencias) {
    const logs = db.findAll('logs').filter(log => 
      log.tipo === 'PRESERVACAO_LOCAL_CRIME' &&
      ocorrencias.some(o => o.id === log.ocorrenciaId)
    );

    return logs.length;
  }
}

module.exports = new DHPPService();