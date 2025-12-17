import React, { useState, useCallback } from 'react';
import './ConsultarOcorrencias.css';

const ConsultarOcorrencias = () => {
  const [consulta, setConsulta] = useState({
    tipo: 'protocolo', // protocolo, id, filtros
    valor: '',
    loading: false,
    resultado: null,
    error: null
  });

  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: '',
    status: '',
    orgao: '',
    localizacao: ''
  });

  const [ocorrencias, setOcorrencias] = useState([]);
  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    total: 0,
    porPagina: 10
  });

  // Função para consultar por protocolo ou ID
  const consultarPorProtocolo = useCallback(async () => {
    if (!consulta.valor.trim()) {
      setConsulta(prev => ({ ...prev, error: 'Digite um protocolo ou ID válido' }));
      return;
    }

    try {
      setConsulta(prev => ({ ...prev, loading: true, error: null, resultado: null }));

      const token = localStorage.getItem('token');
      const baseURL = 'http://localhost:3000';
      
      // Determinar se é protocolo ou ID
      const isProtocolo = consulta.valor.startsWith('OC-');
      const endpoint = isProtocolo 
        ? `/api/ocorrencias/protocolo/${consulta.valor}`
        : `/api/ocorrencias/${consulta.valor}`;

      console.log(`🔍 Consultando: ${endpoint}`);

      const response = await fetch(`${baseURL}${endpoint}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseText = await response.text();
        try {
          const ocorrencia = JSON.parse(responseText);
          setConsulta(prev => ({ 
            ...prev, 
            loading: false, 
            resultado: ocorrencia,
            error: null 
          }));
        } catch (parseError) {
          throw new Error('Erro no formato da resposta do servidor');
        }
      } else if (response.status === 404) {
        setConsulta(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Ocorrência não encontrada' 
        }));
      } else {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

    } catch (error) {
      console.error('❌ Erro na consulta:', error);
      setConsulta(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
    }
  }, [consulta.valor]);

  // Função para consultar com filtros
  const consultarComFiltros = useCallback(async () => {
    try {
      setConsulta(prev => ({ ...prev, loading: true, error: null }));
      setOcorrencias([]);

      const token = localStorage.getItem('token');
      const baseURL = 'http://localhost:3000';
      
      // Construir query params
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim()) {
          params.append(key, value.trim());
        }
      });

      console.log(`🔍 Consultando com filtros: ${params.toString()}`);

      const response = await fetch(`${baseURL}/api/ocorrencias?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          const ocorrenciasList = data.data || data || [];
          
          setOcorrencias(ocorrenciasList);
          setPaginacao(prev => ({ 
            ...prev, 
            total: ocorrenciasList.length 
          }));
          
          setConsulta(prev => ({ 
            ...prev, 
            loading: false, 
            error: null 
          }));
        } catch (parseError) {
          throw new Error('Erro no formato da resposta do servidor');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

    } catch (error) {
      console.error('❌ Erro na consulta:', error);
      setConsulta(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
    }
  }, [filtros]);

  // Função para carregar dados mockados
  const carregarDadosMockados = useCallback(() => {
    console.log('🧪 Carregando dados mockados...');
    
    const ocorrenciasMockadas = [
      {
        id: '1',
        protocolo: 'OC-2025-00001',
        tipo: 'Assalto',
        descricao: 'Assalto à mão armada em andamento',
        localizacao: 'Rua das Flores, 100 - Centro',
        latitude: -19.9180,
        longitude: -43.9360,
        status: 'Aberta',
        dataHoraRegistro: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        orgao: { nome: 'PMMG', sigla: 'PMMG' },
        centralChamada: { nomeChamador: 'Maria Silva' },
        despachos: [
          {
            id: 'desp-1',
            viaturaId: 'viat-1',
            status: 'Enviada',
            dataHoraDespacho: new Date(Date.now() - 90 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: '2',
        protocolo: 'OC-2025-00002',
        tipo: 'Acidente de Trânsito',
        descricao: 'Colisão entre dois veículos',
        localizacao: 'Av. Brasil, 500 - Savassi',
        latitude: -19.9300,
        longitude: -43.9500,
        status: 'Em Atendimento',
        dataHoraRegistro: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        orgao: { nome: 'PMMG', sigla: 'PMMG' },
        centralChamada: { nomeChamador: 'João Santos' },
        despachos: [
          {
            id: 'desp-2',
            viaturaId: 'viat-2',
            status: 'Em Atendimento',
            dataHoraDespacho: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: '3',
        protocolo: 'OC-2025-00003',
        tipo: 'Homicídio',
        descricao: 'Corpo encontrado na praça',
        localizacao: 'Praça da Liberdade - Centro',
        latitude: -19.9320,
        longitude: -43.9380,
        status: 'Finalizada',
        dataHoraRegistro: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        dataHoraEncerramento: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        orgao: { nome: 'DHPP', sigla: 'DHPP' },
        centralChamada: { nomeChamador: 'Carlos Mendes' },
        despachos: [
          {
            id: 'desp-3',
            viaturaId: 'viat-3',
            status: 'Concluída',
            dataHoraDespacho: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
            acoes: 'Local isolado, perícia realizada, corpo removido'
          }
        ]
      }
    ];

    setOcorrencias(ocorrenciasMockadas);
    setPaginacao(prev => ({ ...prev, total: ocorrenciasMockadas.length }));
    setConsulta(prev => ({ ...prev, loading: false, error: null }));
  }, []);

  // Funções auxiliares
  const formatarData = useCallback((dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  }, []);

  const getStatusColor = useCallback((status) => {
    const cores = {
      'Aberta': '#007bff',
      'Despachada': '#17a2b8',
      'Em Atendimento': '#dc3545',
      'Finalizada': '#28a745',
      'Ocorrência aberta': '#007bff',
      'Viatura Solicitada': '#ffc107'
    };
    return cores[status] || '#6c757d';
  }, []);

  const handleConsultaChange = useCallback((campo, valor) => {
    setConsulta(prev => ({ ...prev, [campo]: valor }));
  }, []);

  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);

  const limparConsulta = useCallback(() => {
    setConsulta({
      tipo: 'protocolo',
      valor: '',
      loading: false,
      resultado: null,
      error: null
    });
    setOcorrencias([]);
    setFiltros({
      dataInicio: '',
      dataFim: '',
      tipo: '',
      status: '',
      orgao: '',
      localizacao: ''
    });
  }, []);

  return (
    <div className="consultar-ocorrencias">
      <div className="consultar-header">
        <h2>🔍 Consultar Ocorrências</h2>
        <p>Busque ocorrências por protocolo, ID ou use filtros avançados</p>
      </div>

      {/* Controles de Consulta */}
      <div className="consulta-controls">
        {/* Consulta Rápida */}
        <div className="consulta-rapida">
          <h3>🎯 Consulta Rápida</h3>
          
          <div className="tipo-consulta">
            <label>
              <input
                type="radio"
                name="tipoConsulta"
                value="protocolo"
                checked={consulta.tipo === 'protocolo'}
                onChange={(e) => handleConsultaChange('tipo', e.target.value)}
              />
              Por Protocolo (ex: OC-2025-00001)
            </label>
            <label>
              <input
                type="radio"
                name="tipoConsulta"
                value="id"
                checked={consulta.tipo === 'id'}
                onChange={(e) => handleConsultaChange('tipo', e.target.value)}
              />
              Por ID
            </label>
          </div>

          <div className="busca-input">
            <input
              type="text"
              placeholder={consulta.tipo === 'protocolo' ? 'Digite o protocolo (ex: OC-2025-00001)' : 'Digite o ID da ocorrência'}
              value={consulta.valor}
              onChange={(e) => handleConsultaChange('valor', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && consultarPorProtocolo()}
            />
            <button 
              className="btn btn-primary"
              onClick={consultarPorProtocolo}
              disabled={consulta.loading}
            >
              {consulta.loading ? (
                <>
                  <span className="spinner"></span>
                  Buscando...
                </>
              ) : (
                '🔍 Buscar'
              )}
            </button>
          </div>

          <div className="acoes-rapidas">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={carregarDadosMockados}
            >
              🧪 Dados de Teste
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={limparConsulta}
            >
              🗑️ Limpar
            </button>
          </div>
        </div>

        {/* Filtros Avançados */}
        <div className="filtros-avancados">
          <h3>⚙️ Filtros Avançados</h3>
          
          <div className="filtros-grid">
            <div className="filtro-item">
              <label>Data Início:</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              />
            </div>

            <div className="filtro-item">
              <label>Data Fim:</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              />
            </div>

            <div className="filtro-item">
              <label>Tipo:</label>
              <select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Assalto">Assalto</option>
                <option value="Acidente de Trânsito">Acidente de Trânsito</option>
                <option value="Homicídio">Homicídio</option>
                <option value="Furto">Furto</option>
                <option value="Violência Doméstica">Violência Doméstica</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>Status:</label>
              <select
                value={filtros.status}
                onChange={(e) => handleFiltroChange('status', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Aberta">Aberta</option>
                <option value="Despachada">Despachada</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Finalizada">Finalizada</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>Órgão:</label>
              <select
                value={filtros.orgao}
                onChange={(e) => handleFiltroChange('orgao', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="PMMG">PMMG</option>
                <option value="DHPP">DHPP</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>Localização:</label>
              <input
                type="text"
                placeholder="Digite parte do endereço"
                value={filtros.localizacao}
                onChange={(e) => handleFiltroChange('localizacao', e.target.value)}
              />
            </div>
          </div>

          <div className="filtros-acoes">
            <button 
              className="btn btn-primary"
              onClick={consultarComFiltros}
              disabled={consulta.loading}
            >
              {consulta.loading ? (
                <>
                  <span className="spinner"></span>
                  Consultando...
                </>
              ) : (
                '🔍 Consultar com Filtros'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {consulta.error && (
        <div className="error-consulta">
          <span>⚠️ {consulta.error}</span>
          <div className="error-actions">
            <button 
              className="btn btn-primary"
              onClick={consulta.tipo === 'protocolo' ? consultarPorProtocolo : consultarComFiltros}
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

      {/* Resultado da Consulta Rápida */}
      {consulta.resultado && (
        <div className="resultado-unico">
          <h3>📋 Resultado da Consulta</h3>
          <div className="ocorrencia-detalhada">
            <div className="ocorrencia-header">
              <div className="ocorrencia-info">
                <h4>{consulta.resultado.protocolo}</h4>
                <span className="tipo">{consulta.resultado.tipo}</span>
              </div>
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(consulta.resultado.status) }}
              >
                {consulta.resultado.status}
              </div>
            </div>

            <div className="ocorrencia-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Descrição:</span>
                  <span className="value">{consulta.resultado.descricao}</span>
                </div>
                <div className="info-item">
                  <span className="label">Localização:</span>
                  <span className="value">{consulta.resultado.localizacao}</span>
                </div>
                <div className="info-item">
                  <span className="label">Data/Hora:</span>
                  <span className="value">{formatarData(consulta.resultado.dataHoraRegistro)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Órgão:</span>
                  <span className="value">{consulta.resultado.orgao?.nome || 'N/A'}</span>
                </div>
                {consulta.resultado.centralChamada && (
                  <div className="info-item">
                    <span className="label">Chamador:</span>
                    <span className="value">{consulta.resultado.centralChamada.nomeChamador}</span>
                  </div>
                )}
                {consulta.resultado.dataHoraEncerramento && (
                  <div className="info-item">
                    <span className="label">Encerrada em:</span>
                    <span className="value">{formatarData(consulta.resultado.dataHoraEncerramento)}</span>
                  </div>
                )}
              </div>

              {consulta.resultado.despachos && consulta.resultado.despachos.length > 0 && (
                <div className="despachos-section">
                  <h5>🚔 Despachos</h5>
                  {consulta.resultado.despachos.map(despacho => (
                    <div key={despacho.id} className="despacho-item">
                      <div className="despacho-info">
                        <span className="despacho-status">{despacho.status}</span>
                        <span className="despacho-data">{formatarData(despacho.dataHoraDespacho)}</span>
                      </div>
                      {despacho.acoes && (
                        <div className="despacho-acoes">
                          <strong>Ações:</strong> {despacho.acoes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lista de Ocorrências (Filtros) */}
      {ocorrencias.length > 0 && (
        <div className="lista-ocorrencias">
          <h3>📊 Resultados da Consulta ({ocorrencias.length})</h3>
          
          <div className="ocorrencias-grid">
            {ocorrencias.map(ocorrencia => (
              <div key={ocorrencia.id} className="ocorrencia-card">
                <div className="card-header">
                  <div className="ocorrencia-info">
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
                    <span className="label">Data/Hora:</span>
                    <span className="value">{formatarData(ocorrencia.dataHoraRegistro)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Órgão:</span>
                    <span className="value">{ocorrencia.orgao?.sigla || 'N/A'}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setConsulta(prev => ({ ...prev, resultado: ocorrencia }))}
                  >
                    👁️ Ver Detalhes
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
        </div>
      )}

      {/* Estado Inicial */}
      {!consulta.resultado && ocorrencias.length === 0 && !consulta.loading && !consulta.error && (
        <div className="estado-inicial">
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>Consulte Ocorrências</h3>
            <p>Use a consulta rápida por protocolo/ID ou aplique filtros avançados para encontrar ocorrências.</p>
            <div className="sugestoes">
              <button 
                className="btn btn-secondary"
                onClick={carregarDadosMockados}
              >
                🧪 Ver Dados de Exemplo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultarOcorrencias;