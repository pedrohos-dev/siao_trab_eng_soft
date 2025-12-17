import { useState } from 'react';
import PainelViaturaInterface from './PainelViaturaInterface';
import './TestePainelViatura.css';

const TestePainelViatura = () => {
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testLogs, setTestLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const log = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestLogs(prev => [log, ...prev.slice(0, 9)]); // Keep last 10 logs
  };

  const simularNovaOcorrencia = () => {
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

    // Simular evento WebSocket
    window.dispatchEvent(new CustomEvent('mock-websocket-message', {
      detail: {
        tipo: 'NOVA_OCORRENCIA_VIATURA',
        viatura_id: 1,
        ocorrencia: mockOcorrencia
      }
    }));

    addLog(`Nova ocorrência simulada: #${mockOcorrencia.id}`, 'success');
  };

  const simularAtualizacaoStatus = (status) => {
    window.dispatchEvent(new CustomEvent('mock-websocket-message', {
      detail: {
        tipo: 'ATUALIZAR_STATUS_OCORRENCIA',
        ocorrencia_id: 1,
        viatura_id: 1,
        status: status
      }
    }));

    addLog(`Status atualizado para: ${status}`, 'info');
  };

  const simularErroConexao = () => {
    window.dispatchEvent(new CustomEvent('mock-websocket-error', {
      detail: {
        error: 'Conexão perdida com o servidor'
      }
    }));

    addLog('Erro de conexão simulado', 'error');
  };

  const simularGeolocalizacao = () => {
    const lat = -19.9167 + (Math.random() - 0.5) * 0.01;
    const lng = -43.9345 + (Math.random() - 0.5) * 0.01;

    // Override navigator.geolocation temporariamente
    const originalGeolocation = navigator.geolocation;
    
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
        return 1;
      },
      clearWatch: () => {}
    };

    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true
    });

    // Restaurar após 5 segundos
    setTimeout(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true
      });
    }, 5000);

    addLog(`Geolocalização simulada: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'info');
  };

  const executarTestesAutomaticos = async () => {
    addLog('Iniciando testes automatizados...', 'info');
    
    // Teste 1: Geolocalização
    simularGeolocalizacao();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 2: Nova ocorrência
    simularNovaOcorrencia();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Teste 3: Atualização de status
    simularAtualizacaoStatus('em_andamento');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Teste 4: Finalização
    simularAtualizacaoStatus('encerrada');
    await new Promise(resolve => setTimeout(resolve, 1000));

    addLog('Testes automatizados concluídos!', 'success');
  };

  const limparLogs = () => {
    setTestLogs([]);
  };

  return (
    <div className="teste-painel-viatura">
      {/* Painel de Teste */}
      <div className={`test-panel ${showTestPanel ? 'open' : ''}`}>
        <div className="test-panel-header">
          <h3>🧪 Painel de Testes</h3>
          <button 
            className="toggle-btn"
            onClick={() => setShowTestPanel(!showTestPanel)}
          >
            {showTestPanel ? '✕' : '⚙️'}
          </button>
        </div>
        
        {showTestPanel && (
          <div className="test-panel-content">
            <div className="test-actions">
              <h4>Ações de Teste</h4>
              <div className="test-buttons">
                <button onClick={simularNovaOcorrencia} className="btn-test primary">
                  🚨 Nova Ocorrência
                </button>
                <button onClick={() => simularAtualizacaoStatus('em_andamento')} className="btn-test warning">
                  🔄 Em Andamento
                </button>
                <button onClick={() => simularAtualizacaoStatus('encerrada')} className="btn-test success">
                  ✅ Encerrar
                </button>
                <button onClick={simularGeolocalizacao} className="btn-test info">
                  📍 Geolocalização
                </button>
                <button onClick={simularErroConexao} className="btn-test danger">
                  ❌ Erro Conexão
                </button>
                <button onClick={executarTestesAutomaticos} className="btn-test auto">
                  🚀 Teste Automático
                </button>
              </div>
            </div>

            <div className="test-logs">
              <div className="logs-header">
                <h4>📋 Logs de Teste</h4>
                <button onClick={limparLogs} className="btn-clear">
                  🗑️ Limpar
                </button>
              </div>
              <div className="logs-content">
                {testLogs.length === 0 ? (
                  <p className="no-logs">Nenhum log ainda...</p>
                ) : (
                  testLogs.map(log => (
                    <div key={log.id} className={`log-entry ${log.type}`}>
                      <span className="log-time">{log.timestamp}</span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="test-info">
              <h4>ℹ️ Informações</h4>
              <div className="info-grid">
                <div className="info-item">
                  <strong>URL:</strong> {window.location.pathname}
                </div>
                <div className="info-item">
                  <strong>Viewport:</strong> {window.innerWidth}x{window.innerHeight}
                </div>
                <div className="info-item">
                  <strong>WebSocket:</strong> {window.WebSocket ? '✅' : '❌'}
                </div>
                <div className="info-item">
                  <strong>Geolocalização:</strong> {navigator.geolocation ? '✅' : '❌'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interface Principal */}
      <div className="main-interface">
        <PainelViaturaInterface />
      </div>

      {/* Botão flutuante para mostrar/esconder painel */}
      {!showTestPanel && (
        <button 
          className="floating-test-btn"
          onClick={() => setShowTestPanel(true)}
          title="Abrir Painel de Testes"
        >
          🧪
        </button>
      )}
    </div>
  );
};

export default TestePainelViatura;