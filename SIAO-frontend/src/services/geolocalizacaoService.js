import { api } from './api';

export const geolocalizacaoService = {
  // Atualizar posição da viatura
  atualizarPosicao: async (viaturaId, latitude, longitude, velocidade = 0) => {
    const response = await api.post('/geolocalizacao', {
      viaturaId,
      latitude,
      longitude,
      velocidade
    });
    return response.data;
  },
  
  // Obter posição atual da viatura
  obterPosicaoViatura: async (viaturaId) => {
    const response = await api.get(`/geolocalizacao/viatura/${viaturaId}`);
    return response.data;
  },
  
  // Obter histórico de posições da viatura
  obterHistoricoPosicoes: async (viaturaId, dataInicio, dataFim) => {
    const params = new URLSearchParams();
    
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const response = await api.get(`/geolocalizacao/viatura/${viaturaId}/historico?${params.toString()}`);
    return response.data;
  },
  
  // Obter viaturas próximas a um ponto
  obterViaturasProximas: async (latitude, longitude, raio = 10) => {
    const params = new URLSearchParams({
      lat: latitude,
      lng: longitude,
      raio
    });
    
    const response = await api.get(`/geolocalizacao/viaturas-proximas?${params.toString()}`);
    return response.data;
  }
};