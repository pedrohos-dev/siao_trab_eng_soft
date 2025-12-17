/**
 * Service para gerenciar Reforços Policiais
 * CRUD completo para sistema de reforços
 */

const db = require('../database/jsonDatabase');
const GeoService = require('./GeolocalizacaoService');

class ReforcoService {

  /**
   * Solicita reforço policial para uma ocorrência
   */
  async solicitarReforco(dadosReforco) {
    try {
      const { ocorrenciaId, solicitadoPor, nivelUrgencia, tipoReforco, observacoes } = dadosReforco;

      // Validar dados
      this.validarDadosReforco(dadosReforco);

      // Verificar se ocorrência existe
      const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
      if (!ocorrencia) {
        throw new Error('Ocorrência não encontrada');
      }

      // Verificar se usuário existe
      const usuario = db.findById('usuarios', solicitadoPor);
      if (!usuario) {
        throw new Error('Usuário solicitante não encontrado');
      }

      // Criar solicitação de reforço
      const reforco = db.create('reforcosPolicia', {
        ocorrenciaId,
        solicitadoPor,
        nivelUrgencia: parseInt(nivelUrgencia),
        tipoReforco: tipoReforco || 'APOIO_GERAL',
        observacoes: observacoes || '',
        dataHoraSolicitacao: new Date().toISOString(),
        status: 'PENDENTE',
        dataHoraAtendimento: null,
        viaturaAtendimento: null,
        tempoResposta: null
      });

      // Determinar viaturas disponíveis para atendimento
      const viaturasDisponiveis = await this.buscarViaturasParaReforco(ocorrencia, nivelUrgencia);

      // Se há viaturas disponíveis, tentar despachar automaticamente
      if (viaturasDisponiveis.length > 0 && nivelUrgencia >= 4) {
        await this.despacharReforcoAutomatico(reforco, viaturasDisponiveis[0]);
      }

      // Log da solicitação
      db.create('logs', {
        tipo: 'REFORCO_SOLICITADO',
        reforcoId: reforco.id,
        ocorrenciaId,
        solicitadoPor,
        nivelUrgencia,
        timestamp: new Date().toISOString()
      });

      console.log(`🚨 Reforço solicitado: ${reforco.id} (Urgência: ${nivelUrgencia})`);
      return reforco;

    } catch (error) {
      console.error('❌ Erro ao solicitar reforço:', error);
      throw error;
    }
  }

  /**
   * Atende uma solicitação de reforço
   */
  async atenderReforco(reforcoId, dadosAtendimento) {
    try {
      const { viaturaId, usuarioResponsavel, observacoes } = dadosAtendimento;

      const reforco = db.findById('reforcosPolicia', reforcoId);
      if (!reforco) {
        throw new Error('Reforço não encontrado');
      }

      if (reforco.status !== 'PENDENTE') {
        throw new Error('Reforço já foi atendido ou cancelado');
      }

      // Verificar se viatura existe e está disponível
      const viatura = db.findById('viaturas', viaturaId);
      if (!viatura) {
        throw new Error('Viatura não encontrada');
      }

      if (viatura.status !== 'Disponível') {
        throw new Error('Viatura não está disponível');
      }

      // Calcular tempo de resposta
      const tempoResposta = new Date() - new Date(reforco.dataHoraSolicitacao);

      // Atualizar reforço
      const reforcoAtualizado = db.update('reforcosPolicia', reforcoId, {
        status: 'ATENDIDO',
        dataHoraAtendimento: new Date().toISOString(),
        viaturaAtendimento: viaturaId,
        usuarioResponsavel,
        observacoesAtendimento: observacoes || '',
        tempoResposta: Math.round(tempoResposta / (1000 * 60)) // em minutos
      });

      // Atualizar status da viatura
      db.update('viaturas', viaturaId, {
        status: 'Em Deslocamento'
      });

      // Criar despacho para o reforço
      const ocorrencia = db.findById('ocorrencias', reforco.ocorrenciaId);
      const despacho = db.create('despachos', {
        ocorrenciaId: reforco.ocorrenciaId,
        viaturaId,
        dataHoraDespacho: new Date().toISOString(),
        status: 'Enviada',
        observacoes: `Reforço policial - Nível ${reforco.nivelUrgencia}`,
        tipoDespacho: 'REFORCO',
        reforcoId: reforcoId
      });

      // Log do atendimento
      db.create('logs', {
        tipo: 'REFORCO_ATENDIDO',
        reforcoId,
        viaturaId,
        usuarioResponsavel,
        tempoResposta: reforcoAtualizado.tempoResposta,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Reforço atendido: ${reforcoId} por viatura ${viatura.prefixo}`);
      return { reforco: reforcoAtualizado, despacho };

    } catch (error) {
      console.error('❌ Erro ao atender reforço:', error);
      throw error;
    }
  }

  /**
   * Cancela uma solicitação de reforço
   */
  async cancelarReforco(reforcoId, motivo, usuarioId) {
    try {
      const reforco = db.findById('reforcosPolicia', reforcoId);
      if (!reforco) {
        throw new Error('Reforço não encontrado');
      }

      if (reforco.status !== 'PENDENTE') {
        throw new Error('Apenas reforços pendentes podem ser cancelados');
      }

      // Atualizar reforço
      const reforcoAtualizado = db.update('reforcosPolicia', reforcoId, {
        status: 'CANCELADO',
        dataHoraCancelamento: new Date().toISOString(),
        motivoCancelamento: motivo,
        canceladoPor: usuarioId
      });

      // Log do cancelamento
      db.create('logs', {
        tipo: 'REFORCO_CANCELADO',
        reforcoId,
        motivo,
        canceladoPor: usuarioId,
        timestamp: new Date().toISOString()
      });

      console.log(`❌ Reforço cancelado: ${reforcoId} - ${motivo}`);
      return reforcoAtualizado;

    } catch (error) {
      console.error('❌ Erro ao cancelar reforço:', error);
      throw error;
    }
  }

  /**
   * Lista reforços com filtros
   */
  async listarReforcos(filtros = {}) {
    try {
      let reforcos = db.findAll('reforcosPolicia');

      // Aplicar filtros
      if (filtros.status) {
        reforcos = reforcos.filter(r => r.status === filtros.status);
      }

      if (filtros.nivelUrgencia) {
        reforcos = reforcos.filter(r => r.nivelUrgencia >= parseInt(filtros.nivelUrgencia));
      }

      if (filtros.ocorrenciaId) {
        reforcos = reforcos.filter(r => r.ocorrenciaId === filtros.ocorrenciaId);
      }

      if (filtros.solicitadoPor) {
        reforcos = reforcos.filter(r => r.solicitadoPor === filtros.solicitadoPor);
      }

      if (filtros.dataInicio && filtros.dataFim) {
        const inicio = new Date(filtros.dataInicio);
        const fim = new Date(filtros.dataFim);
        reforcos = reforcos.filter(r => {
          const data = new Date(r.dataHoraSolicitacao);
          return data >= inicio && data <= fim;
        });
      }

      // Enriquecer com dados relacionados
      const reforcosDetalhados = reforcos.map(r => this.enriquecerReforco(r));

      // Ordenar por urgência e data
      reforcosDetalhados.sort((a, b) => {
        if (a.nivelUrgencia !== b.nivelUrgencia) {
          return b.nivelUrgencia - a.nivelUrgencia; // Maior urgência primeiro
        }
        return new Date(b.dataHoraSolicitacao) - new Date(a.dataHoraSolicitacao); // Mais recente primeiro
      });

      return {
        reforcos: reforcosDetalhados,
        total: reforcosDetalhados.length,
        filtros
      };

    } catch (error) {
      console.error('❌ Erro ao listar reforços:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de um reforço específico
   */
  async obterReforco(reforcoId) {
    try {
      const reforco = db.findById('reforcosPolicia', reforcoId);
      if (!reforco) {
        throw new Error('Reforço não encontrado');
      }

      return this.enriquecerReforco(reforco);

    } catch (error) {
      console.error('❌ Erro ao obter reforço:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de reforços
   */
  async obterEstatisticas(periodo = '30d') {
    try {
      const agora = new Date();
      let dataInicio;

      switch (periodo) {
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
          dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const reforcos = db.findAll('reforcosPolicia').filter(r => 
        new Date(r.dataHoraSolicitacao) >= dataInicio
      );

      const estatisticas = {
        periodo,
        total: reforcos.length,
        porStatus: this.agruparPorCampo(reforcos, 'status'),
        porNivelUrgencia: this.agruparPorCampo(reforcos, 'nivelUrgencia'),
        porTipoReforco: this.agruparPorCampo(reforcos, 'tipoReforco'),
        tempoMedioResposta: this.calcularTempoMedioResposta(reforcos),
        taxaAtendimento: this.calcularTaxaAtendimento(reforcos),
        reforcosPendentes: reforcos.filter(r => r.status === 'PENDENTE').length,
        reforcosAtendidos: reforcos.filter(r => r.status === 'ATENDIDO').length,
        reforcosCancelados: reforcos.filter(r => r.status === 'CANCELADO').length
      };

      return estatisticas;

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  validarDadosReforco(dados) {
    const { ocorrenciaId, solicitadoPor, nivelUrgencia } = dados;

    if (!ocorrenciaId) {
      throw new Error('ID da ocorrência é obrigatório');
    }

    if (!solicitadoPor) {
      throw new Error('Solicitante é obrigatório');
    }

    const nivel = parseInt(nivelUrgencia);
    if (isNaN(nivel) || nivel < 1 || nivel > 5) {
      throw new Error('Nível de urgência deve ser entre 1 e 5');
    }
  }

  async buscarViaturasParaReforco(ocorrencia, nivelUrgencia) {
    try {
      // Buscar viaturas disponíveis do mesmo órgão
      const viaturas = db.findAll('viaturas').filter(v => 
        v.orgaoId === ocorrencia.orgaoId && v.status === 'Disponível'
      );

      // Se urgência alta (4-5), buscar também de outros órgãos
      if (nivelUrgencia >= 4) {
        const outrasViaturas = db.findAll('viaturas').filter(v => 
          v.orgaoId !== ocorrencia.orgaoId && v.status === 'Disponível'
        );
        viaturas.push(...outrasViaturas);
      }

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
      console.error('❌ Erro ao buscar viaturas para reforço:', error);
      return [];
    }
  }

  async despacharReforcoAutomatico(reforco, viatura) {
    try {
      // Atualizar reforço
      db.update('reforcosPolicia', reforco.id, {
        status: 'ATENDIDO',
        dataHoraAtendimento: new Date().toISOString(),
        viaturaAtendimento: viatura.id,
        usuarioResponsavel: 'SISTEMA_AUTOMATICO',
        observacoesAtendimento: 'Despacho automático por alta urgência'
      });

      // Atualizar viatura
      db.update('viaturas', viatura.id, {
        status: 'Em Deslocamento'
      });

      console.log(`🤖 Reforço despachado automaticamente: ${viatura.prefixo}`);

    } catch (error) {
      console.error('❌ Erro no despacho automático:', error);
    }
  }

  enriquecerReforco(reforco) {
    const ocorrencia = db.findById('ocorrencias', reforco.ocorrenciaId);
    const solicitante = db.findById('usuarios', reforco.solicitadoPor);
    const viatura = reforco.viaturaAtendimento ? db.findById('viaturas', reforco.viaturaAtendimento) : null;
    const responsavel = reforco.usuarioResponsavel ? db.findById('usuarios', reforco.usuarioResponsavel) : null;

    return {
      ...reforco,
      ocorrencia,
      solicitante,
      viatura,
      responsavel
    };
  }

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

  agruparPorCampo(reforcos, campo) {
    return reforcos.reduce((acc, r) => {
      const valor = r[campo] || 'Não informado';
      acc[valor] = (acc[valor] || 0) + 1;
      return acc;
    }, {});
  }

  calcularTempoMedioResposta(reforcos) {
    const atendidos = reforcos.filter(r => r.status === 'ATENDIDO' && r.tempoResposta);
    
    if (atendidos.length === 0) return 0;

    const tempoTotal = atendidos.reduce((acc, r) => acc + r.tempoResposta, 0);
    return Math.round(tempoTotal / atendidos.length);
  }

  calcularTaxaAtendimento(reforcos) {
    if (reforcos.length === 0) return 0;
    
    const atendidos = reforcos.filter(r => r.status === 'ATENDIDO').length;
    return Math.round((atendidos / reforcos.length) * 100);
  }
}

module.exports = new ReforcoService();