import { api } from './api';

export const usuarioService = {
  // Listar usuários com filtros
  listar: async (filtros = {}) => {
    const params = new URLSearchParams();
    
    if (filtros.perfil) params.append('perfil', filtros.perfil);
    if (filtros.ativo !== undefined) params.append('ativo', filtros.ativo);
    if (filtros.orgaoId) params.append('orgaoId', filtros.orgaoId);
    
    const response = await api.get(`/usuarios?${params.toString()}`);
    return response.data;
  },
  
  // Buscar usuário por ID
  buscarPorId: async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },
  
  // Criar usuário
  criar: async (dados) => {
    const response = await api.post('/usuarios', dados);
    return response.data;
  },
  
  // Atualizar usuário
  atualizar: async (id, dados) => {
    const response = await api.put(`/usuarios/${id}`, dados);
    return response.data;
  },
  
  // Ativar/desativar usuário
  toggleAtivo: async (id) => {
    const response = await api.put(`/usuarios/${id}/toggle-ativo`);
    return response.data;
  },
  // Resetar senha
  resetarSenha: async (id, novaSenha) => {
    const response = await api.post(`/usuarios/${id}/resetar-senha`, { novaSenha });
    return response.data;
  }
};