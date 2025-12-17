const db = require('../database/jsonDatabase');

class RelatorioService {
  async gerarRelatorioOcorrencias(filtros = {}) {
    let ocorrencias = db.findAll('ocorrencias');
    
    // Aplicar filtros
    if (filtros.dataInicio && filtros.dataFim) {
      ocorrencias = ocorrencias.filter(o => {
        const data = new Date(o.dataHoraRegistro);
        return data >= new Date(filtros.dataInicio) && data <= new Date(filtros.dataFim);
      });
    }
    
    if (filtros.tipo) {
      ocorrencias = ocorrencias.filter(o => o.tipo === filtros.tipo);
    }
    
    if (filtros.status) {
      ocorrencias = ocorrencias.filter(o => o.status === filtros.status);
    }
    
    if (filtros.orgaoId) {
      ocorrencias = ocorrencias.filter(o => o.orgaoId === filtros.orgaoId);
    }
    
    // Estatísticas
    const total = ocorrencias.length;
    const abertas = ocorrencias.filter(o => o.status === 'Aberta').length;
    const encerradas = ocorrencias.filter(o => o.status === 'Encerrada').length;
    
    // Agrupar por tipo
    const porTipo = {};
    ocorrencias.forEach(o => {
      porTipo[o.tipo] = (porTipo[o.tipo] || 0) + 1;
    });
    
    // Agrupar por órgão
    const porOrgao = {};
    ocorrencias.forEach(o => {
      porOrgao[o.orgaoId] = (porOrgao[o.orgaoId] || 0) + 1;
    });
    
    // Enriquecer dados de órgãos
    const orgaos = db.findAll('orgaos');
    const porOrgaoDetalhado = Object.keys(porOrgao).map(orgaoId => {
      const orgao = orgaos.find(o => o.id === orgaoId) || { nome: 'Desconhecido' };
      return {
        orgaoId,
        nome: orgao.nome,
        sigla: orgao.sigla,
        quantidade: porOrgao[orgaoId]
      };
    });
    
    return {
      periodo: {
        inicio: filtros.dataInicio || 'Início dos registros',
        fim: filtros.dataFim || 'Até agora'
      },
      estatisticas: {
        total,
        abertas,
        encerradas,
        percentualEncerradas: total > 0 ? (encerradas / total * 100).toFixed(2) : 0
      },
      distribuicao: {
        porTipo,
        porOrgao: porOrgaoDetalhado
      },
      ocorrencias: ocorrencias.map(o => ({
        id: o.id,
        protocolo: o.protocolo,
        tipo: o.tipo,
        status: o.status,
        dataHoraRegistro: o.dataHoraRegistro,
        dataHoraEncerramento: o.dataHoraEncerramento,
        orgaoId: o.orgaoId
      }))
    };
  }

  async gerarRelatorioDespachos(filtros = {}) {
    let despachos = db.findAll('despachos');
    
    // Aplicar filtros
    if (filtros.dataInicio && filtros.dataFim) {
      despachos = despachos.filter(d => {
        const data = new Date(d.dataHoraDespacho);
        return data >= new Date(filtros.dataInicio) && data <= new Date(filtros.dataFim);
      });
    }
    
    if (filtros.status) {
      despachos = despachos.filter(d => d.status === filtros.status);
    }
    
    if (filtros.ocorrenciaId) {
      despachos = despachos.filter(d => d.ocorrenciaId === filtros.ocorrenciaId);
    }
    
    if (filtros.viaturaId) {
      despachos = despachos.filter(d => d.viaturaId === filtros.viaturaId);
    }
    
    // Estatísticas
    const total = despachos.length;
    const enviados = despachos.filter(d => d.status === 'Enviada').length;
    const emCampo = despachos.filter(d => d.status === 'Em Campo').length;
    const noLocal = despachos.filter(d => d.status === 'No Local').length;
    const concluidos = despachos.filter(d => d.status === 'Concluído').length;
    
    // Calcular tempo médio de resposta (do despacho até a chegada)
    let tempoTotalResposta = 0;
    let despachosComChegada = 0;
    
    despachos.forEach(d => {
      if (d.dataHoraDespacho && d.dataHoraChegada) {
        const despachoTime = new Date(d.dataHoraDespacho).getTime();
        const chegadaTime = new Date(d.dataHoraChegada).getTime();
        const diferencaMinutos = (chegadaTime - despachoTime) / (1000 * 60);
        
        tempoTotalResposta += diferencaMinutos;
        despachosComChegada++;
      }
    });
    
    const tempoMedioResposta = despachosComChegada > 0 
      ? (tempoTotalResposta / despachosComChegada).toFixed(2) 
      : 0;
    
    // Enriquecer com dados de ocorrências e viaturas
    const despachosDetalhados = await Promise.all(despachos.map(async d => {
      const ocorrencia = db.findById('ocorrencias', d.ocorrenciaId);
      const viatura = db.findById('viaturas', d.viaturaId);
      
      return {
        ...d,
        ocorrencia: ocorrencia ? {
          protocolo: ocorrencia.protocolo,
          tipo: ocorrencia.tipo,
          localizacao: ocorrencia.localizacao
        } : null,
        viatura: viatura ? {
          prefixo: viatura.prefixo,
          placa: viatura.placa,
          tipo: viatura.tipo
        } : null
      };
    }));
    
    return {
      periodo: {
        inicio: filtros.dataInicio || 'Início dos registros',
        fim: filtros.dataFim || 'Até agora'
      },
      estatisticas: {
        total,
        enviados,
        emCampo,
        noLocal,
        concluidos,
        tempoMedioResposta: `${tempoMedioResposta} minutos`
      },
      despachos: despachosDetalhados
    };
  }

  async gerarRelatorioDesempenho(filtros = {}) {
    // Obter dados de despachos
    const despachos = db.findAll('despachos');
    const viaturas = db.findAll('viaturas');
    const ocorrencias = db.findAll('ocorrencias');
    
    // Filtrar por período
    let despachosNoPeríodo = despachos;
    if (filtros.dataInicio && filtros.dataFim) {
      despachosNoPeríodo = despachos.filter(d => {
        const data = new Date(d.dataHoraDespacho);
        return data >= new Date(filtros.dataInicio) && data <= new Date(filtros.dataFim);
      });
    }
    
    // Desempenho por viatura
    const desempenhoPorViatura = {};
    
    despachosNoPeríodo.forEach(d => {
      if (!desempenhoPorViatura[d.viaturaId]) {
        const viatura = viaturas.find(v => v.id === d.viaturaId);
        
        desempenhoPorViatura[d.viaturaId] = {
          viaturaId: d.viaturaId,
          prefixo: viatura ? viatura.prefixo : 'Desconhecido',
          totalDespachos: 0,
          despachosCompletos: 0,
          tempoTotalResposta: 0,
          despachosComTempo: 0
        };
      }
      
      desempenhoPorViatura[d.viaturaId].totalDespachos++;
      
      if (d.status === 'Concluído') {
        desempenhoPorViatura[d.viaturaId].despachosCompletos++;
      }
      
      if (d.dataHoraDespacho && d.dataHoraChegada) {
        const despachoTime = new Date(d.dataHoraDespacho).getTime();
        const chegadaTime = new Date(d.dataHoraChegada).getTime();
        const diferencaMinutos = (chegadaTime - despachoTime) / (1000 * 60);
        
        desempenhoPorViatura[d.viaturaId].tempoTotalResposta += diferencaMinutos;
        desempenhoPorViatura[d.viaturaId].despachosComTempo++;
      }
    });
    
    // Calcular médias e formatar resultado
    const desempenhoViaturas = Object.values(desempenhoPorViatura).map(d => ({
      ...d,
      tempoMedioResposta: d.despachosComTempo > 0 
        ? (d.tempoTotalResposta / d.despachosComTempo).toFixed(2) 
        : 0,
      taxaEficiencia: d.totalDespachos > 0 
        ? (d.despachosCompletos / d.totalDespachos * 100).toFixed(2) 
        : 0
    }));
    
    // Ordenar por eficiência
    desempenhoViaturas.sort((a, b) => b.taxaEficiencia - a.taxaEficiencia);
    
    // Estatísticas gerais
    const totalDespachos = despachosNoPeríodo.length;
    const despachosCompletos = despachosNoPeríodo.filter(d => d.status === 'Concluído').length;
    const taxaEficienciaGeral = totalDespachos > 0 
      ? (despachosCompletos / totalDespachos * 100).toFixed(2) 
      : 0;
    
    // Tempo médio geral
    let tempoTotalGeral = 0;
    let despachosComTempoGeral = 0;
    
    despachosNoPeríodo.forEach(d => {
      if (d.dataHoraDespacho && d.dataHoraChegada) {
        const despachoTime = new Date(d.dataHoraDespacho).getTime();
        const chegadaTime = new Date(d.dataHoraChegada).getTime();
        const diferencaMinutos = (chegadaTime - despachoTime) / (1000 * 60);
        
        tempoTotalGeral += diferencaMinutos;
        despachosComTempoGeral++;
      }
    });
    
    const tempoMedioGeral = despachosComTempoGeral > 0 
      ? (tempoTotalGeral / despachosComTempoGeral).toFixed(2) 
      : 0;
    
    return {
      periodo: {
        inicio: filtros.dataInicio || 'Início dos registros',
        fim: filtros.dataFim || 'Até agora'
      },
      estatisticasGerais: {
        totalDespachos,
        despachosCompletos,
        taxaEficiencia: `${taxaEficienciaGeral}%`,
        tempoMedioResposta: `${tempoMedioGeral} minutos`
      },
      desempenhoViaturas
    };
  }
}

module.exports = new RelatorioService();