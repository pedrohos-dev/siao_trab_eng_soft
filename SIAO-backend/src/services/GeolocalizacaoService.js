const db = require('../database/jsonDatabase');

class GeolocalizacaoService {
  // Algoritmo Haversine para calcular distância entre dois pontos
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em km
  }

  toRad(valor) {
    return valor * Math.PI / 180;
  }

  async encontrarViaturasProximas(latitude, longitude, raioKm = 10) {
    // Buscar todas as viaturas disponíveis
    const viaturas = db.findAll('viaturas', { status: 'Disponível' });
    const geolocalizacoes = db.findAll('geolocalizacao');

    // Mapear viaturas com suas geolocalizações
    const viaturasComLocalizacao = viaturas
      .map(viatura => {
        const geo = geolocalizacoes.find(g => g.viaturaId === viatura.id);
        if (!geo) return null;

        const distancia = this.calcularDistancia(
          latitude,
          longitude,
          geo.latitude,
          geo.longitude
        );

        return {
          ...viatura,
          geolocalizacao: geo,
          distancia: parseFloat(distancia.toFixed(2))
        };
      })
      .filter(v => v !== null && v.distancia <= raioKm)
      .sort((a, b) => a.distancia - b.distancia);

    return viaturasComLocalizacao;
  }

  async atualizarPosicaoViatura(viaturaId, latitude, longitude, velocidade = 0) {
    // Buscar geolocalização existente
    const geoExistente = db.findOne('geolocalizacao', { viaturaId });

    if (geoExistente) {
      // Atualizar
      return db.update('geolocalizacao', geoExistente.id, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        velocidade: parseFloat(velocidade),
        dataHoraAtualizacao: new Date().toISOString()
      });
    } else {
      // Criar
      return db.create('geolocalizacao', {
        viaturaId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        velocidade: parseFloat(velocidade),
        dataHoraAtualizacao: new Date().toISOString()
      });
    }
  }

  async obterPosicaoViatura(viaturaId) {
    return db.findOne('geolocalizacao', { viaturaId });
  }
}

module.exports = new GeolocalizacaoService();