import { api } from './api';

export const despachoService = {
  // Listar despachos com filtros
  listar: async (filtros = {}) => {
    const params = new URLSearchParams();
    
    if (filtros.ocorrenciaId) params.append('ocorrenciaId', filtros.ocorrenciaId);
    if (filtros.viaturaId) params.append('viaturaId', filtros.viaturaId);
    if (filtros.status) params.append('status', filtros.status);
    
    const response = await api.get(`/despachos?${params.toString()}`);
    return response.data;
  },
  
  // Buscar despacho por ID
  buscarPorId: async (id) => {
    const response = await api.get(`/despachos/${id}`);
    return response.data;
  },
  
  // Criar despacho
  criar: async (dados) => {
    const response = await api.post('/despachos', dados);
    return response.data;
  },
  
  // Registrar chegada
  registrarChegada: async (id) => {
    const response = await api.put(`/despachos/${id}/chegada`);
    return response.data;
  },
  
  // Registrar ações
  registrarAcoes: async (id, acoes) => {
    const response = await api.post(`/despachos/${id}/acoes`, { acoes });
    return response.data;
  },
  
  // Atualizar status
  atualizarStatus: async (id, status, observacoes = '') => {
    const response = await api.put(`/despachos/${id}/status`, { status, observacoes });
    return response.data;
  },
  
  // Encontrar viatura próxima
  encontrarViaturaProxima: async (ocorrenciaId) => {
    const response = await api.get(`/despachos/viatura-proxima/${ocorrenciaId}`);
    return response.data;
  }
};