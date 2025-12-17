const db = require('../database/jsonDatabase');
const GeolocalizacaoService = require('./GeolocalizacaoService');

class ViaturaService {
  async listarViaturas(filtros = {}) {
    let viaturas = db.findAll('viaturas');
    
    // Aplicar filtros
    if (filtros.status) {
      viaturas = viaturas.filter(v => v.status === filtros.status);
    }
    
    if (filtros.tipo) {
      viaturas = viaturas.filter(v => v.tipo === filtros.tipo);
    }
    
    if (filtros.orgaoId) {
      viaturas = viaturas.filter(v => v.orgaoId === filtros.orgaoId);
    }
    
    // Enriquecer com dados de geolocalização
    const viaturasComGeo = await Promise.all(viaturas.map(async v => {
      const geo = db.findOne('geolocalizacao', { viaturaId: v.id });
      const painel = db.findOne('painelViaturas', { viaturaId: v.id });
      
      return {
        ...v,
        geolocalizacao: geo || null,
        painel: painel || null
      };
    }));
    
    return viaturasComGeo;
  }

  async obterViaturasDisponiveis() {
    return this.listarViaturas({ status: 'Disponível' });
  }

  async obterViaturasProximas(latitude, longitude, raioKm = 10) {
    return GeolocalizacaoService.encontrarViaturasProximas(latitude, longitude, raioKm);
  }

  async atualizarStatusViatura(viaturaId, novoStatus, observacoes = '') {
    const viatura = db.findById('viaturas', viaturaId);
    if (!viatura) {
      throw new Error('Viatura não encontrada');
    }
    
    // Atualizar viatura
    const viaturaAtualizada = db.update('viaturas', viaturaId, {
      status: novoStatus
    });
    
    // Atualizar painel da viatura
    const painelViatura = db.findOne('painelViaturas', { viaturaId });
    
    if (painelViatura) {
      let statusOperacional;
      
      switch (novoStatus) {
        case 'Disponível':
          statusOperacional = 'Em Patrulha';
          break;
        case 'Em Deslocamento':
        case 'No Local':
          statusOperacional = 'Em Atendimento';
          break;
        case 'Manutenção':
          statusOperacional = 'Indisponível';
          break;
        default:
          statusOperacional = 'Em Patrulha';
      }
      
      db.update('painelViaturas', painelViatura.id, {
        statusOperacional,
        ultimaAtualizacao: new Date().toISOString(),
        observacoes: observacoes || painelViatura.observacoes
      });
    }
    
    return viaturaAtualizada;
  }

  async criarViatura(dados) {
    const { placa, prefixo, tipo, orgaoId } = dados;
    
    // Verificar se já existe viatura com mesma placa ou prefixo
    const viaturaExistente = db.findOne('viaturas', { placa }) || db.findOne('viaturas', { prefixo });
    
    if (viaturaExistente) {
      throw new Error('Já existe uma viatura com esta placa ou prefixo');
    }
    
    // Verificar se órgão existe
    const orgao = db.findById('orgaos', orgaoId);
    if (!orgao) {
      throw new Error('Órgão não encontrado');
    }
    
    // Criar viatura
    const viatura = db.create('viaturas', {
      placa,
      prefixo,
      tipo,
      status: 'Disponível',
      orgaoId
    });
    
    // Criar painel da viatura
    db.create('painelViaturas', {
      viaturaId: viatura.id,
      statusOperacional: 'Em Patrulha',
      ultimaAtualizacao: new Date().toISOString(),
      observacoes: ''
    });
    
    return viatura;
  }
}

module.exports = new ViaturaService();