import React, { useState, useEffect, useCallback } from 'react';
import './RecursosProximos.css';

const RecursosProximos = () => {
  const [recursos, setRecursos] = useState({
    viaturas: [],
    ocorrencias: [],
    loading: false,
    error: null
  });
  const [filtros, setFiltros] = useState({
    raio: 5,
    tipoRecurso: 'todos',
    status: 'todos'
  });
  const [localizacao, setLocalizacao] = useState({
    latitude: null,
    longitude: null,
    obtida: false,
    erro: null,
    carregando: false,
    manual: false
  });
  const [dadosCarregados, setDadosCarregados] = useState(false);

  // Função para obter geolocalização uma única vez
  const obterLocalizacao = useCallback(() => {
    if (!navigator.geolocation) {
      setLocalizacao(prev => ({
        ...prev,
        erro: 'Geolocalização não é suportada pelo seu navegador',
        carregando: false
      }));
      return;
    }

    setLocalizacao(prev => ({ ...prev, carregando: true, erro: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocalizacao({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          obtida: true,
          erro: null,
          carregando: false,
          manual: false
        });
      },
      (error) => {
        setLocalizacao(prev => ({
          ...prev,
          erro: error.message,
          carregando: false,
          obtida: false
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  }, []);

  // Função para definir localização manual
  const definirLocalizacaoManual = useCallback((lat, lng) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      setLocalizacao(prev => ({
        ...prev,
        erro: 'Coordenadas inválidas'
      }));
      return;
    }

    setLocalizacao({
      latitude,
      longitude,
      obtida: true,
      erro: null,
      carregando: false,
      manual: true
    });
  }, []);

  // Função para buscar recursos próximos
  const buscarRecursosProximos = useCallback(async () => {
    if (!localizacao.obtida) return;

    try {
      setRecursos(prev => ({ ...prev, loading: true, error: null }));

      const { latitude, longitude } = localizacao;
      const token = localStorage.getItem('token');
      const baseURL = 'http://localhost:3000';
      
      console.log(`🔍 Buscando recursos para: ${latitude}, ${longitude} (raio: ${filtros.raio}km)`);

      // Buscar viaturas próximas
      let viaturasData = { data: [] };
      try {
        const viaturasResponse = await fetch(
          `${baseURL}/api/geolocalizacao/viaturas-proximas?latitude=${latitude}&longitude=${longitude}&raio=${filtros.raio}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (viaturasResponse.ok) {
          const responseText = await viaturasResponse.text();
          try {
            viaturasData = JSON.parse(responseText);
          } catch (parseError) {
            console.warn('⚠️ Erro ao parsear JSON viaturas');
          }
        }
      } catch (fetchError) {
        console.warn('⚠️ Erro na requisição viaturas:', fetchError.message);
      }

      // Buscar ocorrências próximas
      let ocorrenciasData = { data: [] };
      try {
        const ocorrenciasResponse = await fetch(
          `${baseURL}/api/ocorrencias?latitude=${latitude}&longitude=${longitude}&raio=${filtros.raio}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (ocorrenciasResponse.ok) {
          const responseText = await ocorrenciasResponse.text();
          try {
            ocorrenciasData = JSON.parse(responseText);
          } catch (parseError) {
            console.warn('⚠️ Erro ao parsear JSON ocorrências');
          }
        }
      } catch (fetchError) {
        console.warn('⚠️ Erro na requisição ocorrências:', fetchError.message);
      }

      // Filtrar por status se necessário
      let viaturasFiltradas = viaturasData.data || [];
      let ocorrenciasFiltradas = ocorrenciasData.data || [];

      if (filtros.status !== 'todos') {
        viaturasFiltradas = viaturasFiltradas.filter(v => v.status === filtros.status);
        ocorrenciasFiltradas = ocorrenciasFiltradas.filter(o => o.status === filtros.status);
      }

      setRecursos({
        viaturas: viaturasFiltradas,
        ocorrencias: ocorrenciasFiltradas,
        loading: false,
        error: null
      });

      setDadosCarregados(true);

    } catch (error) {
      console.error('❌ Erro ao buscar recursos:', error);
      setRecursos(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [localizacao.obtida, localizacao.latitude, localizacao.longitude, filtros.raio, filtros.status]);

  // Effect para buscar recursos quando localização ou filtros mudarem
  useEffect(() => {
    if (localizacao.obtida) {
      buscarRecursosProximos();
    }
  }, [localizacao.obtida, filtros, buscarRecursosProximos]);

  // Função para carregar dados mockados
  const carregarDadosMockados = useCallback(() => {
    console.log('🧪 Carregando dados mockados...');
    
    setLocalizacao({
      latitude: -19.9167,
      longitude: -43.9345,
      obtida: true,
      erro: null,
      carregando: false,
      manual: true
    });

    setRecursos({
      viaturas: [
        {
          id: '1',
          prefixo: 'PM-001',
          placa: 'ABC-1234',
          tipo: 'Patrulha',
          status: 'Disponível',
          posicao: {
            latitude: -19.9167,
            longitude: -43.9345,
            dataHoraAtualizacao: new Date().toISOString()
          },
          distancia: 2.5
        },
        {
          id: '2',
          prefixo: 'PM-002',
          placa: 'DEF-5678',
          tipo: 'Patrulha',
          status: 'Em Deslocamento',
          posicao: {
            latitude: -19.9200,
            longitude: -43.9400,
            dataHoraAtualizacao: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          },
          distancia: 3.2
        }
      ],
      ocorrencias: [
        {
          id: '1',
          protocolo: 'OC-2025-00001',
          tipo: 'Assalto',
          descricao: 'Assalto à mão armada em andamento',
          localizacao: 'Rua das Flores, 100 - Centro',
          latitude: -19.9180,
          longitude: -43.9360,
          status: 'Aberta',
          dataHoraRegistro: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          distancia: 1.8
        }
      ],
      loading: false,
      error: null
    });

    setDadosCarregados(true);
  }, []);

  // Funções auxiliares
  const calcularDistancia = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  }, []);

  const formatarTempo = useCallback((dataString) => {
    const agora = new Date();
    const data = new Date(dataString);
    const diffMs = agora - data;
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutos < 60) {
      return `${diffMinutos}min atrás`;
    } else if (diffMinutos < 1440) {
      const horas = Math.floor(diffMinutos / 60);
      return `${horas}h atrás`;
    } else {
      const dias = Math.floor(diffMinutos / 1440);
      return `${dias}d atrás`;
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    const cores = {
      'Disponível': '#28a745',
      'Em Deslocamento': '#ffc107',
      'Em Atendimento': '#dc3545',
      'Manutenção': '#6c757d',
      'Aberta': '#007bff',
      'Despachada': '#17a2b8',
      'Finalizada': '#28a745',
      'Ocorrência aberta': '#007bff',
      'Viatura Solicitada': '#ffc107'
    };
    return cores[status] || '#6c757d';
  }, []);

  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: campo === 'raio' ? parseInt(valor) : valor
    }));
  }, []);

  return (
    <div className="recursos-proximos">
      <div className="recursos-header">
        <h2>📍 Recursos Próximos</h2>
        <p>Visualize viaturas e ocorrências próximas à sua localização</p>
      </div>

      {/* Controles de Localização */}
      <div className="localizacao-controls">
        <div className="localizacao-atual">
          <h3>📍 Sua Localização</h3>
          
          <div className="geo-status">
            {localizacao.carregando && (
              <div className="loading-geo">
                <span className="spinner"></span>
                Obtendo localização...
              </div>
            )}
            
            {localizacao.erro && (
              <div className="geo-error">
                <span>⚠️ {localizacao.erro}</span>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={obterLocalizacao}
                >
                  Tentar Novamente
                </button>
              </div>
            )}
            
            {localizacao.obtida && (
              <div className="geo-success">
                <span>✅ Localização {localizacao.manual ? 'manual' : 'GPS'}</span>
                <div className="coordenadas">
                  Lat: {localizacao.latitude.toFixed(6)}, 
                  Lng: {localizacao.longitude.toFixed(6)}
                </div>
              </div>
            )}
          </div>

          <div className="localizacao-manual">
            <h4>📝 Localização Manual</h4>
            <div className="coordenadas-manual">
              <input
                type="number"
                step="any"
                placeholder="Latitude (ex: -19.9167)"
                id="latitude-input"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude (ex: -43.9345)"
                id="longitude-input"
              />
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const lat = document.getElementById('latitude-input').value;
                  const lng = document.getElementById('longitude-input').value;
                  definirLocalizacaoManual(lat, lng);
                }}
              >
                📍 Usar Coordenadas
              </button>
            </div>
            <small>💡 Dica: Use -19.9167, -43.9345 para Belo Horizonte</small>
          </div>

          {/* Botões de ação */}
          <div className="acoes-localizacao">
            <button 
              className="btn btn-primary btn-sm"
              onClick={obterLocalizacao}
              disabled={localizacao.carregando}
            >
              📍 Obter GPS
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={carregarDadosMockados}
            >
              🧪 Dados de Teste
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="filtros">
          <h3>🔍 Filtros</h3>
          <div className="filtros-grid">
            <div className="filtro-item">
              <label>Raio (km):</label>
              <select
                value={filtros.raio}
                onChange={(e) => handleFiltroChange('raio', e.target.value)}
              >
                <option value={1}>1 km</option>
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>Tipo:</label>
              <select
                value={filtros.tipoRecurso}
                onChange={(e) => handleFiltroChange('tipoRecurso', e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="viaturas">Apenas Viaturas</option>
                <option value="ocorrencias">Apenas Ocorrências</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>Status:</label>
              <select
                value={filtros.status}
                onChange={(e) => handleFiltroChange('status', e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="Disponível">Disponível</option>
                <option value="Em Deslocamento">Em Deslocamento</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Aberta">Aberta</option>
                <option value="Despachada">Despachada</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {recursos.loading && (
        <div className="loading-recursos">
          <div className="spinner"></div>
          <p>Buscando recursos próximos...</p>
        </div>
      )}

      {recursos.error && (
        <div className="error-recursos">
          <span>⚠️ {recursos.error}</span>
          <div className="error-actions">
            <button 
              className="btn btn-primary"
              onClick={buscarRecursosProximos}
            >
              Tentar Novamente
            </button>
            <button 
              className="btn btn-secondary"
              onClick={carregarDadosMockados}
            >
              🧪 Usar Dados de Teste
            </button>
          </div>
        </div>
      )}

      {dadosCarregados && !recursos.loading && !recursos.error && (
        <div className="recursos-resultados">
          {/* Viaturas */}
          {(filtros.tipoRecurso === 'todos' || filtros.tipoRecurso === 'viaturas') && (
            <div className="recursos-secao">
              <h3>🚔 Viaturas Próximas ({recursos.viaturas.length})</h3>
              
              {recursos.viaturas.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma viatura encontrada no raio de {filtros.raio}km</p>
                </div>
              ) : (
                <div className="recursos-grid">
                  {recursos.viaturas.map(viatura => (
                    <div key={viatura.id} className="recurso-card viatura-card">
                      <div className="card-header">
                        <div className="recurso-info">
                          <h4>{viatura.prefixo}</h4>
                          <span className="placa">{viatura.placa}</span>
                        </div>
                        <div 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(viatura.status) }}
                        >
                          {viatura.status}
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="info-item">
                          <span className="label">Tipo:</span>
                          <span className="value">{viatura.tipo}</span>
                        </div>
                        
                        {viatura.posicao && (
                          <>
                            <div className="info-item">
                              <span className="label">Distância:</span>
                              <span className="value distance">
                                {viatura.distancia ? viatura.distancia.toFixed(2) : 
                                 calcularDistancia(
                                   localizacao.latitude,
                                   localizacao.longitude,
                                   viatura.posicao.latitude,
                                   viatura.posicao.longitude
                                 )} km
                              </span>
                            </div>
                            
                            <div className="info-item">
                              <span className="label">Última atualização:</span>
                              <span className="value">
                                {formatarTempo(viatura.posicao.dataHoraAtualizacao)}
                              </span>
                            </div>
                          </>
                        )}

                        {viatura.posicao && (
                          <div className="coordenadas-info">
                            <small>
                              📍 {viatura.posicao.latitude.toFixed(6)}, {viatura.posicao.longitude.toFixed(6)}
                            </small>
                          </div>
                        )}
                      </div>

                      <div className="card-actions">
                        <button className="btn btn-outline btn-sm">
                          👁️ Detalhes
                        </button>
                        {viatura.status === 'Disponível' && (
                          <button className="btn btn-primary btn-sm">
                            📞 Contatar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ocorrências */}
          {(filtros.tipoRecurso === 'todos' || filtros.tipoRecurso === 'ocorrencias') && (
            <div className="recursos-secao">
              <h3>🚨 Ocorrências Próximas ({recursos.ocorrencias.length})</h3>
              
              {recursos.ocorrencias.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma ocorrência encontrada no raio de {filtros.raio}km</p>
                </div>
              ) : (
                <div className="recursos-grid">
                  {recursos.ocorrencias.map(ocorrencia => (
                    <div key={ocorrencia.id} className="recurso-card ocorrencia-card">
                      <div className="card-header">
                        <div className="recurso-info">
                          <h4>{ocorrencia.protocolo}</h4>
                          <span className="tipo">{ocorrencia.tipo}</span>
                        </div>
                        <div 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(ocorrencia.status) }}
                        >
                          {ocorrencia.status}
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="info-item">
                          <span className="label">Descrição:</span>
                          <span className="value">{ocorrencia.descricao}</span>
                        </div>
                        
                        <div className="info-item">
                          <span className="label">Local:</span>
                          <span className="value">{ocorrencia.localizacao}</span>
                        </div>
                        
                        <div className="info-item">
                          <span className="label">Distância:</span>
                          <span className="value distance">
                            {ocorrencia.distancia ? ocorrencia.distancia.toFixed(2) :
                             calcularDistancia(
                               localizacao.latitude,
                               localizacao.longitude,
                               ocorrencia.latitude,
                               ocorrencia.longitude
                             )} km
                          </span>
                        </div>
                        
                        <div className="info-item">
                          <span className="label">Registrada:</span>
                          <span className="value">
                            {formatarTempo(ocorrencia.dataHoraRegistro)}
                          </span>
                        </div>

                        <div className="coordenadas-info">
                          <small>
                            📍 {ocorrencia.latitude.toFixed(6)}, {ocorrencia.longitude.toFixed(6)}
                          </small>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button className="btn btn-outline btn-sm">
                          👁️ Detalhes
                        </button>
                        {ocorrencia.status !== 'Finalizada' && (
                          <button className="btn btn-success btn-sm">
                            🚨 Solicitar Reforço
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Resumo */}
          <div className="recursos-resumo">
            <h3>📊 Resumo</h3>
            <div className="resumo-grid">
              <div className="resumo-item">
                <span className="numero">{recursos.viaturas.length}</span>
                <span className="label">Viaturas</span>
              </div>
              <div className="resumo-item">
                <span className="numero">{recursos.ocorrencias.length}</span>
                <span className="label">Ocorrências</span>
              </div>
              <div className="resumo-item">
                <span className="numero">{filtros.raio}</span>
                <span className="label">Raio (km)</span>
              </div>
              <div className="resumo-item">
                <span className="numero">
                  {recursos.viaturas.filter(v => v.status === 'Disponível').length}
                </span>
                <span className="label">Disponíveis</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!localizacao.obtida && !recursos.loading && !dadosCarregados && (
        <div className="sem-localizacao">
          <div className="empty-state">
            <span className="empty-icon">📍</span>
            <h3>Localização necessária</h3>
            <p>Para visualizar recursos próximos, obtenha sua localização ou use dados de teste.</p>
            <div className="localizacao-actions">
              <button 
                className="btn btn-primary"
                onClick={obterLocalizacao}
              >
                📍 Obter Localização GPS
              </button>
              <button 
                className="btn btn-secondary"
                onClick={carregarDadosMockados}
              >
                🧪 Usar Dados de Teste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecursosProximos;