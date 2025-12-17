import api from './api';

// Mock data for development
const mockOcorrencias = [
  {
    id: 1,
    tipo: 'Acidente de trânsito',
    descricao: 'Colisão entre dois veículos na Av. Principal',
    endereco: 'Av. Principal, 1000',
    bairro: 'Centro',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    latitude: -19.9167,
    longitude: -43.9345,
    data_hora: '2023-06-15T14:30:00',
    solicitante: 'João Silva',
    telefone: '(31) 99999-9999',
    status: 'aberta',
    prioridade: 'alta',
    orgao_responsavel: 'PMMG'
  },
  {
    id: 2,
    tipo: 'Furto',
    descricao: 'Furto de celular em estabelecimento comercial',
    endereco: 'Rua Secundária, 500',
    bairro: 'Savassi',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    latitude: -19.9367,
    longitude: -43.9345,
    data_hora: '2023-06-15T15:45:00',
    solicitante: 'Maria Oliveira',
    telefone: '(31) 88888-8888',
    status: 'em_andamento',
    prioridade: 'media',
    orgao_responsavel: 'PMMG'
  },
  {
    id: 3,
    tipo: 'Homicídio',
    descricao: 'Corpo encontrado em residência',
    endereco: 'Rua Terciária, 200',
    bairro: 'Funcionários',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    latitude: -19.9267,
    longitude: -43.9245,
    data_hora: '2023-06-15T16:20:00',
    solicitante: 'Carlos Pereira',
    telefone: '(31) 77777-7777',
    status: 'encerrada',
    prioridade: 'alta',
    orgao_responsavel: 'DHPP'
  }
];

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

export const ocorrenciaService = {
  listar: async (filtros = {}) => {
    try {
      if (isDev) {
        console.log('Using mock data for ocorrências');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockOcorrencias;
      }
      
      const response = await api.get('/ocorrencias', { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar ocorrências:', error);
      if (isDev) {
        return mockOcorrencias;
      }
      throw error;
    }
  },
  
  obterPorId: async (id) => {
    try {
      if (isDev) {
        console.log(`Using mock data for ocorrência ${id}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        const ocorrencia = mockOcorrencias.find(o => o.id === parseInt(id));
        if (!ocorrencia) throw new Error('Ocorrência não encontrada');
        return ocorrencia;
      }
      
      const response = await api.get(`/ocorrencias/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter ocorrência ${id}:`, error);
      throw error;
    }
  },
  
  criar: async (ocorrencia) => {
    try {
      if (isDev) {
        console.log('Creating mock ocorrência', ocorrencia);
        await new Promise(resolve => setTimeout(resolve, 700));
        const novaOcorrencia = {
          ...ocorrencia,
          id: mockOcorrencias.length + 1,
          data_hora: new Date().toISOString(),
          status: 'aberta'
        };
        mockOcorrencias.push(novaOcorrencia);
        return novaOcorrencia;
      }
      
      const response = await api.post('/ocorrencias', ocorrencia);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar ocorrência:', error);
      throw error;
    }
  },
  
  atualizar: async (id, ocorrencia) => {
    try {
      if (isDev) {
        console.log(`Updating mock ocorrência ${id}`, ocorrencia);
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = mockOcorrencias.findIndex(o => o.id === parseInt(id));
        if (index === -1) throw new Error('Ocorrência não encontrada');
        
        mockOcorrencias[index] = { ...mockOcorrencias[index], ...ocorrencia };
        return mockOcorrencias[index];
      }
      
      const response = await api.put(`/ocorrencias/${id}`, ocorrencia);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar ocorrência ${id}:`, error);
      throw error;
    }
  },
  
  excluir: async (id) => {
    try {
      if (isDev) {
        console.log(`Deleting mock ocorrência ${id}`);
        await new Promise(resolve => setTimeout(resolve, 400));
        const index = mockOcorrencias.findIndex(o => o.id === parseInt(id));
        if (index === -1) throw new Error('Ocorrência não encontrada');
        
        mockOcorrencias.splice(index, 1);
        return { success: true };
      }
      
      await api.delete(`/ocorrencias/${id}`);
      return { success: true };
    } catch (error) {
      console.error(`Erro ao excluir ocorrência ${id}:`, error);
      throw error;
    }
  }
};

export default ocorrenciaService;