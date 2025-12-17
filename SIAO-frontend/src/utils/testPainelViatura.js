/**
 * Utilitários para testar o Painel Viatura Interface
 * Execute no console do navegador para testes automatizados
 */

// Função para simular uma nova ocorrência
export const simularNovaOcorrencia = () => {
  const mockOcorrencia = {
    id: Math.floor(Math.random() * 1000) + 100,
    tipo: 'Furto',
    descricao: 'Furto de veículo reportado por cidadão',
    endereco: 'Rua Teste, 123 - Centro',
    bairro: 'Centro',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    latitude: -19.9167,
    longitude: -43.9345,
    data_hora: new Date().toISOString(),
    solicitante: 'João Silva',
    telefone: '(31) 99999-9999',
    status: 'aberta',
    prioridade: 'alta',
    orgao_responsavel: 'PMMG'
  };

  // Simular mensagem WebSocket
  window.dispatchEvent(new CustomEvent('mock-websocket-message', {
    detail: {
      tipo: 'NOVA_OCORRENCIA_VIATURA',
      viatura_id: 1,
      ocorrencia: mockOcorrencia
    }
  }));

  console.log('✅ Nova ocorrência simulada:', mockOcorrencia);
  return mockOcorrencia;
};

// Função para simular atualização de status
export const simularAtualizacaoStatus = (status = 'em_andamento') => {
  window.dispatchEvent(new CustomEvent('mock-websocket-message', {
    detail: {
      tipo: 'ATUALIZAR_STATUS_OCORRENCIA',
      ocorrencia_id: 1,
      viatura_id: 1,
      status: status
    }
  }));

  console.log(`✅ Status atualizado para: ${status}`);
};

// Função para simular erro de conexão
export const simularErroConexao = () => {
  window.dispatchEvent(new CustomEvent('mock-websocket-error', {
    detail: {
      error: 'Conexão perdida com o servidor'
    }
  }));

  console.log('❌ Erro de conexão simulado');
};

// Função para testar geolocalização mock
export const simularGeolocalizacao = (lat = -19.9167, lng = -43.9345) => {
  // Override navigator.geolocation
  const mockGeolocation = {
    getCurrentPosition: (success) => {
      success({
        coords: {
          latitude: lat,
          longitude: lng,
          accuracy: 10
        },
        timestamp: Date.now()
      });
    },
    watchPosition: (success) => {
      success({
        coords: {
          latitude: lat,
          longitude: lng,
          accuracy: 10
        },
        timestamp: Date.now()
      });
      return 1; // mock watch ID
    },
    clearWatch: () => {}
  };

  Object.defineProperty(navigator, 'geolocation', {
    value: mockGeolocation,
    configurable: true
  });

  console.log(`✅ Geolocalização simulada: ${lat}, ${lng}`);
};

// Função para executar bateria de testes
export const executarTestesAutomaticos = async () => {
  console.log('🚀 Iniciando testes automatizados do Painel Viatura...');
  
  // Teste 1: Simular geolocalização
  console.log('\n📍 Teste 1: Geolocalização');
  simularGeolocalizacao();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 2: Simular nova ocorrência
  console.log('\n🚨 Teste 2: Nova Ocorrência');
  simularNovaOcorrencia();
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 3: Simular mudança de status
  console.log('\n🔄 Teste 3: Atualização de Status');
  simularAtualizacaoStatus('em_andamento');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 4: Simular finalização
  console.log('\n✅ Teste 4: Finalização de Ocorrência');
  simularAtualizacaoStatus('encerrada');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 5: Simular erro
  console.log('\n❌ Teste 5: Erro de Conexão');
  simularErroConexao();

  console.log('\n🎉 Testes automatizados concluídos!');
  console.log('Verifique a interface para ver os resultados.');
};

// Função para verificar estado atual
export const verificarEstado = () => {
  const estado = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    geolocationSupported: !!navigator.geolocation,
    webSocketSupported: !!window.WebSocket,
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    timestamp: new Date().toISOString()
  };

  console.table(estado);
  return estado;
};

// Função para limpar dados de teste
export const limparDadosTeste = () => {
  // Limpar localStorage se houver dados de teste
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('test') || key.includes('mock')) {
      localStorage.removeItem(key);
    }
  });

  console.log('🧹 Dados de teste limpos');
};

// Função para gerar relatório de teste
export const gerarRelatorioTeste = () => {
  const relatorio = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    performance: {
      navigation: performance.navigation,
      timing: performance.timing
    },
    errors: window.testErrors || [],
    warnings: window.testWarnings || []
  };

  console.log('📊 Relatório de Teste:', relatorio);
  
  // Salvar no localStorage para análise posterior
  localStorage.setItem('painelViatura_testReport', JSON.stringify(relatorio));
  
  return relatorio;
};

// Adicionar ao objeto global para acesso fácil no console
if (typeof window !== 'undefined') {
  window.PainelViaturaTest = {
    simularNovaOcorrencia,
    simularAtualizacaoStatus,
    simularErroConexao,
    simularGeolocalizacao,
    executarTestesAutomaticos,
    verificarEstado,
    limparDadosTeste,
    gerarRelatorioTeste
  };

  console.log('🔧 Utilitários de teste carregados!');
  console.log('Use window.PainelViaturaTest para acessar as funções de teste.');
  console.log('Exemplo: PainelViaturaTest.executarTestesAutomaticos()');
}

export default {
  simularNovaOcorrencia,
  simularAtualizacaoStatus,
  simularErroConexao,
  simularGeolocalizacao,
  executarTestesAutomaticos,
  verificarEstado,
  limparDadosTeste,
  gerarRelatorioTeste
};