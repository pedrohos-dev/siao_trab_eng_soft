import React, { useState, useEffect } from 'react';
import './ListaReforcos.css';

const ListaReforcos = ({ filtros = {}, onAtender, onCancelar, onDetalhes }) => {
  const [reforcos, setReforcos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    carregarReforcos();
  }, [filtros]);

  const carregarReforcos = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/reforcos?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar reforços');
      }

      const data = await response.json();
      setReforcos(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar reforços:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };

  const calcularTempoEspera = (dataString) => {
    const agora = new Date();
    const data = new Date(dataString);
    const diffMs = agora - data;
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutos < 60) {
      return `${diffMinutos}min`;
    } else if (diffMinutos < 1440) {
      const horas = Math.floor(diffMinutos / 60);
      const mins = diffMinutos % 60;
      return `${horas}h${mins > 0 ? ` ${mins}min` : ''}`;
    } else {
      const dias = Math.floor(diffMinutos / 1440);
      return `${dias}d`;
    }
  };

  const getUrgenciaColor = (nivel) => {
    const cores = {
      1: '#28a745',
      2: '#6c757d', 
      3: '#ffc107',
      4: '#fd7e14',
      5: '#dc3545'
    };
    return cores[nivel] || '#6c757d';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDENTE': { color: '#ffc107', text: 'Pendente' },
      'ATENDIDO': { color: '#28a745', text: 'Atendido' },
      'CANCELADO': { color: '#6c757d', text: 'Cancelado' }
    };
    return badges[status] || { color: '#6c757d', text: status };
  };

  if (loading) {
    return (
      <div className="lista-reforcos loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando reforços...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lista-reforcos error">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={carregarReforcos}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (reforcos.length === 0) {
    return (
      <div className="lista-reforcos empty">
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>Nenhum reforço encontrado</h3>
          <p>Não há solicitações de reforço com os filtros aplicados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-reforcos">
      <div className="reforcos-header">
        <h3>🚨 Reforços Policiais ({reforcos.length})</h3>
        <button className="btn btn-refresh" onClick={carregarReforcos}>
          🔄 Atualizar
        </button>
      </div>

      <div className="reforcos-grid">
        {reforcos.map(reforco => {
          const statusBadge = getStatusBadge(reforco.status);
          const urgenciaColor = getUrgenciaColor(reforco.nivelUrgencia);
          
          return (
            <div 
              key={reforco.id} 
              className={`reforco-card ${reforco.status.toLowerCase()}`}
            >
              {/* Header do Card */}
              <div className="card-header">
                <div className="reforco-info">
                  <div className="reforco-id">#{reforco.id.slice(-8)}</div>
                  <div 
                    className="urgencia-badge"
                    style={{ backgroundColor: urgenciaColor }}
                  >
                    Urgência {reforco.nivelUrgencia}
                  </div>
                </div>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: statusBadge.color }}
                >
                  {statusBadge.text}
                </div>
              </div>

              {/* Informações da Ocorrência */}
              <div className="ocorrencia-section">
                <h4>📋 Ocorrência</h4>
                <div className="ocorrencia-details">
                  <div className="detail-item">
                    <span className="label">Protocolo:</span>
                    <span className="value">{reforco.ocorrencia?.protocolo || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Tipo:</span>
                    <span className="value">{reforco.ocorrencia?.tipo || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Local:</span>
                    <span className="value">{reforco.ocorrencia?.localizacao || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Detalhes do Reforço */}
              <div className="reforco-section">
                <h4>👥 Reforço</h4>
                <div className="reforco-details">
                  <div className="detail-item">
                    <span className="label">Tipo:</span>
                    <span className="value">{reforco.tipoReforco || 'APOIO_GERAL'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Solicitado por:</span>
                    <span className="value">{reforco.solicitante?.nome || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Data/Hora:</span>
                    <span className="value">{formatarData(reforco.dataHoraSolicitacao)}</span>
                  </div>
                  {reforco.status === 'PENDENTE' && (
                    <div className="detail-item">
                      <span className="label">Tempo de espera:</span>
                      <span className="value tempo-espera">
                        {calcularTempoEspera(reforco.dataHoraSolicitacao)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {reforco.observacoes && (
                <div className="observacoes-section">
                  <h4>📝 Observações</h4>
                  <p className="observacoes-text">{reforco.observacoes}</p>
                </div>
              )}

              {/* Informações de Atendimento */}
              {reforco.status === 'ATENDIDO' && reforco.viatura && (
                <div className="atendimento-section">
                  <h4>🚔 Atendimento</h4>
                  <div className="atendimento-details">
                    <div className="detail-item">
                      <span className="label">Viatura:</span>
                      <span className="value">{reforco.viatura.prefixo}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Atendido em:</span>
                      <span className="value">{formatarData(reforco.dataHoraAtendimento)}</span>
                    </div>
                    {reforco.tempoResposta && (
                      <div className="detail-item">
                        <span className="label">Tempo de resposta:</span>
                        <span className="value">{reforco.tempoResposta} min</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="card-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => onDetalhes && onDetalhes(reforco)}
                >
                  👁️ Detalhes
                </button>

                {reforco.status === 'PENDENTE' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={() => onAtender && onAtender(reforco)}
                    >
                      ✅ Atender
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => onCancelar && onCancelar(reforco)}
                    >
                      ❌ Cancelar
                    </button>
                  </>
                )}
              </div>

              {/* Indicador de Urgência */}
              {reforco.nivelUrgencia >= 4 && reforco.status === 'PENDENTE' && (
                <div className="urgencia-indicator">
                  <span className="urgencia-pulse"></span>
                  URGENTE
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListaReforcos;