const db = require('../database/jsonDatabase');
const GeolocalizacaoService = require('./GeolocalizacaoService');

class DespachoService {
  async criarDespacho(ocorrenciaId, viaturaId, observacoes = '') {
    // Verificar se ocorrência existe
    const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada');
    }
    
    // Verificar se viatura existe e está disponível (RN03)
    const viatura = db.findById('viaturas', viaturaId);
    if (!viatura) {
      throw new Error('Viatura não encontrada');
    }
    
    if (viatura.status !== 'Disponível') {
      throw new Error('Viatura não está disponível para despacho');
    }
    
    // Criar despacho
    const despacho = db.create('despachos', {
      ocorrenciaId,
      viaturaId,
      dataHoraDespacho: new Date().toISOString(),
      dataHoraChegada: null,
      status: 'Enviada',
      observacoes,
      acoes: []
    });
    
    // Atualizar status da viatura
    db.update('viaturas', viaturaId, {
      status: 'Em Deslocamento'
    });
    
    // Atualizar painel da viatura
    const painelViatura = db.findOne('painelViaturas', { viaturaId });
    if (painelViatura) {
      db.update('painelViaturas', painelViatura.id, {
        statusOperacional: 'Em Atendimento',
        ultimaAtualizacao: new Date().toISOString()
      });
    }
    
    return despacho;
  }

  async registrarChegada(despachoId) {
    const despacho = db.findById('despachos', despachoId);
    if (!despacho) {
      throw new Error('Despacho não encontrado');
    }
    
    // Atualizar despacho
    const despachoAtualizado = db.update('despachos', despachoId, {
      dataHoraChegada: new Date().toISOString(),
      status: 'No Local'
    });
    
    return despachoAtualizado;
  }

  async registrarAcoes(despachoId, acoes) {
    const despacho = db.findById('despachos', despachoId);
    if (!despacho) {
      throw new Error('Despacho não encontrado');
    }
    
    // Verificar se acoes é uma string ou array
    let acoesArray = despacho.acoes || [];
    
    if (typeof acoes === 'string') {
      acoesArray.push({
        descricao: acoes,
        dataHora: new Date().toISOString()
      });
    } else if (Array.isArray(acoes)) {
      acoesArray = acoesArray.concat(
        acoes.map(acao => ({
          descricao: acao,
          dataHora: new Date().toISOString()
        }))
      );
    }
    
    // Atualizar despacho
    const despachoAtualizado = db.update('despachos', despachoId, {
      acoes: acoesArray
    });
    
    return despachoAtualizado;
  }

  async encerrarDespacho(despachoId, observacoes) {
    const despacho = db.findById('despachos', despachoId);
    if (!despacho) {
      throw new Error('Despacho não encontrado');
    }
    
    // RN05: Verificar se há ações registradas
    if (!despacho.acoes || despacho.acoes.length === 0) {
      throw new Error('Não é possível encerrar o despacho sem registrar ações');
    }
    
    // Atualizar despacho
    const despachoAtualizado = db.update('despachos', despachoId, {
      status: 'Concluído',
      observacoes: observacoes || despacho.observacoes
    });
    
    // Atualizar status da viatura
    db.update('viaturas', despacho.viaturaId, {
      status: 'Disponível'
    });
    
    // Atualizar painel da viatura
    const painelViatura = db.findOne('painelViaturas', { viaturaId: despacho.viaturaId });
    if (painelViatura) {
      db.update('painelViaturas', painelViatura.id, {
        statusOperacional: 'Em Patrulha',
        ultimaAtualizacao: new Date().toISOString()
      });
    }
    
    return despachoAtualizado;
  }

  async encontrarViaturaProxima(ocorrenciaId) {
    const ocorrencia = db.findById('ocorrencias', ocorrenciaId);
    if (!ocorrencia) {
      throw new Error('Ocorrência não encontrada');
    }
    
    // RN04: Selecionar viatura mais próxima
    const viaturasProximas = await GeolocalizacaoService.encontrarViaturasProximas(
      ocorrencia.latitude,
      ocorrencia.longitude,
      10 // raio de 10km
    );
    
    if (viaturasProximas.length === 0) {
      throw new Error('Não há viaturas disponíveis nas proximidades');
    }
    
    return viaturasProximas[0]; // A mais próxima
  }
}

module.exports = new DespachoService();