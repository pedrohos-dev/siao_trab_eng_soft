import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ocorrenciaService } from '../../services/ocorrenciaService';
import LoadingSpinner from '../shared/LoadingSpinner';
import './CentralChamadasDashboard.css';

const CentralChamadasDashboard = () => {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todas');
  
  // Use the WebSocket hook with proper handlers
  const { isConnected, lastMessage, isMockMode } = useWebSocket(
    `ws://${window.location.hostname}:3000/ws`,
    {
      onMessage: (data) => {
        console.log('WebSocket message received:', data);
        // Handle incoming WebSocket messages
        if (data.tipo === 'NOVA_OCORRENCIA') {
          setOcorrencias(prev => [data.ocorrencia, ...prev]);
        } else if (data.tipo === 'ATUALIZAR_OCORRENCIA') {
          setOcorrencias(prev => 
            prev.map(ocorrencia => 
              ocorrencia.id === data.ocorrencia.id ? data.ocorrencia : ocorrencia
            )
          );
        }
      },
      onOpen: () => console.log('WebSocket conectado'),
      onClose: () => console.log('WebSocket desconectado'),
      onError: (error) => console.error('Erro no WebSocket:', error),
      mockInDev: true // Enable mock mode in development
    }
  );

  // Load initial data
  const carregarOcorrencias = async () => {
    try {
      setLoading(true);
      const data = await ocorrenciaService.listar();
      setOcorrencias(data);
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
      setError('Falha ao carregar ocorrências. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  // Effect to handle WebSocket messages (if needed)
  useEffect(() => {
    if (lastMessage) {
      console.log('New WebSocket message:', lastMessage);
      // Process message if needed
    }
  }, [lastMessage]);

  // Filter ocorrências based on status
  const ocorrenciasFiltradas = ocorrencias.filter(ocorrencia => {
    if (filtro === 'todas') return true;
    return ocorrencia.status === filtro;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="central-chamadas-dashboard">
      <div className="dashboard-header">
        <h1>Central de Chamadas</h1>
        <div className="actions">
          <Link to="/central/registrar" className="btn btn-primary">
            Nova Ocorrência
          </Link>
          <Link to="/central/ocorrencias" className="btn btn-secondary">
            Ver Todas
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filtros">
        <button 
          className={`filtro-btn ${filtro === 'todas' ? 'active' : ''}`}
          onClick={() => setFiltro('todas')}
        >
          Todas
        </button>
        <button 
          className={`filtro-btn ${filtro === 'aberta' ? 'active' : ''}`}
          onClick={() => setFiltro('aberta')}
        >
          Abertas
        </button>
        <button 
          className={`filtro-btn ${filtro === 'em_andamento' ? 'active' : ''}`}
          onClick={() => setFiltro('em_andamento')}
        >
          Em Andamento
        </button>
        <button 
          className={`filtro-btn ${filtro === 'encerrada' ? 'active' : ''}`}
          onClick={() => setFiltro('encerrada')}
        >
          Encerradas
        </button>
      </div>

      <div className="websocket-status">
        Status do WebSocket: {isConnected ? 
          <span className="status-connected">{isMockMode ? 'Conectado (Modo Simulação)' : 'Conectado'}</span> : 
          <span className="status-disconnected">Desconectado</span>
        }
      </div>

      <div className="ocorrencias-list">
        {ocorrenciasFiltradas.length === 0 ? (
          <div className="no-data">
            <p>Nenhuma ocorrência encontrada.</p>
          </div>
        ) : (
          ocorrenciasFiltradas.map(ocorrencia => (
            <div key={ocorrencia.id} className={`ocorrencia-card status-${ocorrencia.status}`}>
              <div className="ocorrencia-header">
                <h3>Ocorrência #{ocorrencia.id}</h3>
                <span className={`badge badge-${ocorrencia.status}`}>
                  {ocorrencia.status === 'aberta' && 'Aberta'}
                  {ocorrencia.status === 'em_andamento' && 'Em Andamento'}
                  {ocorrencia.status === 'encerrada' && 'Encerrada'}
                  {ocorrencia.status === 'cancelada' && 'Cancelada'}
                </span>
              </div>
              <div className="ocorrencia-body">
                <p><strong>Tipo:</strong> {ocorrencia.tipo}</p>
                <p><strong>Local:</strong> {ocorrencia.endereco}</p>
                <p><strong>Data:</strong> {new Date(ocorrencia.data_hora).toLocaleString()}</p>
                <p><strong>Solicitante:</strong> {ocorrencia.solicitante}</p>
              </div>
              <div className="ocorrencia-footer">
                <Link to={`/central/ocorrencia/${ocorrencia.id}`} className="btn-outline">
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CentralChamadasDashboard;