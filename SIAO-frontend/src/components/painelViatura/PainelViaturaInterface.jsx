import { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useGeolocation } from '../../hooks/useGeolocation';
import { viaturaService } from '../../services/viaturaService';
import LoadingSpinner from '../shared/LoadingSpinner';
import './PainelViaturaInterface.css';

const PainelViaturaInterface = () => {
  const [viatura, setViatura] = useState(null);
  const [ocorrenciaAtual, setOcorrenciaAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modoNoturno, setModoNoturno] = useState(false);
  
  // Get current location
  const { position, error: geoError } = useGeolocation();
  
  // Use the WebSocket hook with proper handlers
  const { isConnected, lastMessage, sendMessage, isMockMode } = useWebSocket(
    `ws://${window.location.hostname}:3000/ws`,
    {
      onMessage: (data) => {
        console.log('Viatura WebSocket message:', data);
        // Handle incoming WebSocket messages
        if (data.tipo === 'NOVA_OCORRENCIA_VIATURA' && data.viatura_id === viatura?.id) {
          setOcorrenciaAtual(data.ocorrencia);
        } else if (data.tipo === 'ATUALIZAR_OCORRENCIA' && data.ocorrencia.id === ocorrenciaAtual?.id) {
          setOcorrenciaAtual(data.ocorrencia);
        } else if (data.tipo === 'ENCERRAR_OCORRENCIA_VIATURA' && data.ocorrencia.id === ocorrenciaAtual?.id) {
          setOcorrenciaAtual(null);
        }
      },
      onOpen: () => console.log('Viatura WebSocket conectado'),
      onClose: () => console.log('Viatura WebSocket desconectado'),
      onError: (error) => console.error('Erro no Viatura WebSocket:', error),
      mockInDev: true // Enable mock mode in development
    }
  );

  // Load viatura data
  useEffect(() => {
    const carregarDadosViatura = async () => {
      try {
        setLoading(true);
        // In a real app, you would get the viatura ID from authentication
        // For now, we'll use a mock ID
        const viaturaId = 1; // Mock ID
        const data = await viaturaService.obterPorId(viaturaId);
        setViatura(data);
        
        // If viatura has an active ocorrência, load it
        if (data.ocorrencia_atual_id) {
          const ocorrencia = await viaturaService.obterOcorrenciaAtual(viaturaId);
          setOcorrenciaAtual(ocorrencia);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da viatura:', error);
        setError('Falha ao carregar dados da viatura. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    carregarDadosViatura();
  }, []);

  // Effect to handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      console.log('New Viatura WebSocket message:', lastMessage);
      // Process message if needed
    }
  }, [lastMessage]);

  // Send location updates
  useEffect(() => {
    if (position && viatura && isConnected) {
      sendMessage({
        tipo: 'ATUALIZAR_LOCALIZACAO',
        viatura_id: viatura.id,
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: new Date().toISOString()
      });
    }
  }, [position, viatura, isConnected, sendMessage]);

  // Toggle night mode
  const toggleModoNoturno = () => {
    setModoNoturno(!modoNoturno);
    document.body.classList.toggle('modo-noturno');
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="error-container">
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={`painel-viatura ${modoNoturno ? 'modo-noturno' : ''}`}>
      <div className="painel-header">
        <div className="viatura-info">
          <h2>Viatura {viatura?.codigo || 'Não identificada'}</h2>
          <p>Status: <span className={`status-${viatura?.status || 'unknown'}`}>
            {viatura?.status || 'Desconhecido'}
          </span></p>
        </div>
        <div className="connection-status">
          <span className={`websocket-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? (isMockMode ? 'Online (Simulação)' : 'Online') : 'Offline'}
          </span>
          <button onClick={toggleModoNoturno} className="btn-modo-noturno">
            {modoNoturno ? 'Modo Dia' : 'Modo Noite'}
          </button>
        </div>
      </div>

      <div className="painel-content">
        <div className="mapa-container">
          <div className="mapa-placeholder">
            <h3>Mapa</h3>
            {position ? (
              <p>Sua posição: {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}</p>
            ) : (
              <p>Obtendo localização...</p>
            )}
            {geoError && (
              <p style={{ color: 'red' }}>Erro de geolocalização: {geoError}</p>
            )}
          </div>
        </div>

        <div className="ocorrencia-container">
          {ocorrenciaAtual ? (
            <div className="ocorrencia-detalhes">
              <h3>Ocorrência #{ocorrenciaAtual.id}</h3>
              <p><strong>Tipo:</strong> {ocorrenciaAtual.tipo}</p>
              <p><strong>Local:</strong> {ocorrenciaAtual.endereco}</p>
              <p><strong>Status:</strong> {ocorrenciaAtual.status}</p>
              <p><strong>Descrição:</strong> {ocorrenciaAtual.descricao}</p>
              
              <div className="acoes-container">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    if (isConnected) {
                      sendMessage({
                        tipo: 'ATUALIZAR_STATUS_OCORRENCIA',
                        ocorrencia_id: ocorrenciaAtual.id,
                        viatura_id: viatura.id,
                        status: 'em_andamento'
                      });
                    }
                  }}
                >
                  Em Atendimento
                </button>
                
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    if (isConnected) {
                      sendMessage({
                        tipo: 'ATUALIZAR_STATUS_OCORRENCIA',
                        ocorrencia_id: ocorrenciaAtual.id,
                        viatura_id: viatura.id,
                        status: 'encerrada'
                      });
                    }
                  }}
                >
                  Finalizar Atendimento
                </button>
              </div>
            </div>
          ) : (
            <div className="sem-ocorrencia">
              <h3>Nenhuma ocorrência designada</h3>
              <p>Aguardando designação de ocorrência pela central.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PainelViaturaInterface;