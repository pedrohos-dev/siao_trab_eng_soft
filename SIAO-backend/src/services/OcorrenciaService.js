const db = require('../database/jsonDatabase');

class OcorrenciaService {
  async gerarProtocolo() {
    const ano = new Date().getFullYear();
    const ocorrencias = db.findAll('ocorrencias');
    
    // Filtrar ocorrências do ano atual
    const ocorrenciasAno = ocorrencias.filter(o => 
      o.protocolo && o.protocolo.startsWith(`OC-${ano}`)
    );
    
    const numero = ocorrenciasAno.length + 1;
    return `OC-${ano}-${String(numero).padStart(5, '0')}`;
  }

  async classificarOcorrencia(tipo) {
    // Implementar lógica de classificação baseada no tipo
    // RN02: Ocorrências de homicídio vão para o DHPP
    const orgaos = db.findAll('orgaos');
    
    if (tipo.toLowerCase().includes('homicídio') || tipo.toLowerCase().includes('homicidio')) {
      return orgaos.find(o => o.sigla === 'DHPP');
    } else {
      return orgaos.find(o => o.sigla === 'PMMG');
    }
  }

  async criarOcorrencia(dados) {
    const { tipo, descricao, localizacao, latitude, longitude, centralChamadasId } = dados;
    
    // Classificar e determinar órgão responsável
    const orgaoResponsavel = await this.classificarOcorrencia(tipo);
    
    if (!orgaoResponsavel) {
      throw new Error('Não foi possível determinar o órgão responsável');
    }
    
    // Gerar protocolo
    const protocolo = await this.gerarProtocolo();
    
    // Criar ocorrência
    const ocorrencia = db.create('ocorrencias', {
      protocolo,
      tipo,
      descricao,
      localizacao,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      status: 'Aberta',
      dataHoraRegistro: new Date().toISOString(),
      dataHoraEncerramento: null,
      orgaoId: orgaoResponsavel.id,
      centralChamadasId
    });
    
    return ocorrencia;
  }

  async encerrarOcorrencia(id, observacoes) {
    const ocorrencia = db.findById('ocorrencias', id);
    
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada');
    }
    
    // RN05: Verificar se há ações registradas antes de encerrar
    const despachos = db.findAll('despachos', { ocorrenciaId: id });
    const temAcoes = despachos.some(d => d.acoes && d.acoes.length > 0);
    
    if (!temAcoes) {
      throw new Error('Não é possível encerrar a ocorrência sem registrar ações');
    }
    
    // Atualizar ocorrência
    const ocorrenciaAtualizada = db.update('ocorrencias', id, {
      status: 'Encerrada',
      dataHoraEncerramento: new Date().toISOString(),
      observacoesEncerramento: observacoes
    });
    
    return ocorrenciaAtualizada;
  }

  async buscarOcorrenciasComDetalhes(filtros = {}) {
    let ocorrencias = db.findAll('ocorrencias');
    
    // Aplicar filtros
    if (filtros.status) {
      ocorrencias = ocorrencias.filter(o => o.status === filtros.status);
    }
    
    if (filtros.tipo) {
      ocorrencias = ocorrencias.filter(o => o.tipo.toLowerCase().includes(filtros.tipo.toLowerCase()));
    }
    
    if (filtros.orgaoId) {
      ocorrencias = ocorrencias.filter(o => o.orgaoId === filtros.orgaoId);
    }
    
    if (filtros.dataInicio && filtros.dataFim) {
      ocorrencias = ocorrencias.filter(o => {
        const data = new Date(o.dataHoraRegistro);
        return data >= new Date(filtros.dataInicio) && data <= new Date(filtros.dataFim);
      });
    }
    
    // Enriquecer com dados relacionados
    const ocorrenciasDetalhadas = await Promise.all(ocorrencias.map(async o => {
      const centralChamada = db.findById('centralChamadas', o.centralChamadasId);
      const orgao = db.findById('orgaos', o.orgaoId);
      const despachos = db.findAll('despachos', { ocorrenciaId: o.id });
      
      return {
        ...o,
        centralChamada,
        orgao,
        despachos
      };
    }));
    
    return ocorrenciasDetalhadas;
  }
}

module.exports = new OcorrenciaService();