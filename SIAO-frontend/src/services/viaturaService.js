import api from './api';

// Mock data for development
const mockViaturas = [
  {
    id: 1,
    codigo: 'VTR-001',
    tipo: 'Viatura Policial',
    status: 'disponivel',
    latitude: -19.9167,
    longitude: -43.9345,
    ultima_atualizacao: '2023-06-15T14:30:00',
    ocorrencia_atual_id: 2,
    equipe: [
      { id: 1, nome: 'Policial Silva', matricula: '12345', funcao: 'Motorista' },
      { id: 2, nome: 'Policial Oliveira', matricula: '67890', funcao: 'Comandante' }
    ]
  },
  {
    id: 2,
    codigo: 'VTR-002',
    tipo: 'Viatura Policial',
    status: 'em_atendimento',
    latitude: -19.9267,
    longitude: -43.9245,
    ultima_atualizacao: '2023-06-15T15:45:00',
    ocorrencia_atual_id: 2,
    equipe: [
      { id: 3, nome: 'Policial Santos', matricula: '54321', funcao: 'Motorista' },
      { id: 4, nome: 'Policial Pereira', matricula: '09876', funcao: 'Comandante' }
    ]
  }
];

// Mock ocorrências for viaturas
const mockOcorrenciasViaturas = [
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
    orgao_responsavel: 'PMMG',
    viatura_id: 2
  }
];

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

export const viaturaService = {
  listar: async (filtros = {}) => {
    try {
      if (isDev) {
        console.log('Using mock data for viaturas');
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockViaturas;
      }
      
      const response = await api.get('/viaturas', { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar viaturas:', error);
      if (isDev) {
        return mockViaturas;
      }
      throw error;
    }
  },
  
  obterPorId: async (id) => {
    try {
      if (isDev) {
        console.log(`Using mock data for viatura ${id}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        const viatura = mockViaturas.find(v => v.id === parseInt(id));
        if (!viatura) throw new Error('Viatura não encontrada');
        return viatura;
      }
      
      const response = await api.get(`/viaturas/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter viatura ${id}:`, error);
      if (isDev && id === 1) {
        return mockViaturas[0];
      }
      throw error;
    }
  },
  
  obterOcorrenciaAtual: async (viaturaId) => {
    try {
      if (isDev) {
        console.log(`Using mock data for ocorrência atual da viatura ${viaturaId}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        const viatura = mockViaturas.find(v => v.id === parseInt(viaturaId));
        if (!viatura) throw new Error('Viatura não encontrada');
        
        if (!viatura.ocorrencia_atual_id) return null;
        
        const ocorrencia = mockOcorrenciasViaturas.find(o => o.id === viatura.ocorrencia_atual_id);
        if (!ocorrencia) throw new Error('Ocorrência não encontrada');
        
        return ocorrencia;
      }
      
      const response = await api.get(`/viaturas/${viaturaId}/ocorrencia-atual`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter ocorrência atual da viatura ${viaturaId}:`, error);
      throw error;
    }
  },
  
  atualizarStatus: async (id, status) => {
    try {
      if (isDev) {
        console.log(`Updating mock viatura ${id} status to ${status}`);
        await new Promise(resolve => setTimeout(resolve, 400));
        const index = mockViaturas.findIndex(v => v.id === parseInt(id));
        if (index === -1) throw new Error('Viatura não encontrada');
        
        mockViaturas[index].status = status;
        return mockViaturas[index];
      }
      
      const response = await api.patch(`/viaturas/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar status da viatura ${id}:`, error);
      throw error;
    }
  },
  
  atualizarLocalizacao: async (id, latitude, longitude) => {
    try {
      if (isDev) {
        console.log(`Updating mock viatura ${id} location`);
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = mockViaturas.findIndex(v => v.id === parseInt(id));
        if (index === -1) throw new Error('Viatura não encontrada');
        
        mockViaturas[index].latitude = latitude;
        mockViaturas[index].longitude = longitude;
        mockViaturas[index].ultima_atualizacao = new Date().toISOString();
        return mockViaturas[index];
      }
      
      const response = await api.patch(`/viaturas/${id}/localizacao`, { latitude, longitude });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar localização da viatura ${id}:`, error);
      throw error;
    }
  }
};

export default viaturaService;