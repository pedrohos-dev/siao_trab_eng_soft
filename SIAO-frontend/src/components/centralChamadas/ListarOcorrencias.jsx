import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ocorrenciaService } from '../../services/ocorrenciaService';
import LoadingSpinner from '../shared/LoadingSpinner';
import './ListarOcorrencias.css';

const ListarOcorrencias = () => {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    status: '',
    tipo: '',
    dataInicio: '',
    dataFim: '',
    termo: ''
  });

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  const carregarOcorrencias = async () => {
    try {
      setLoading(true);
      const data = await ocorrenciaService.listar(filtros);
      setOcorrencias(data);
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error);
      setError('Falha ao carregar ocorrências. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = (e) => {
    e.preventDefault();
    carregarOcorrencias();
  };

  const limparFiltros = () => {
    setFiltros({
      status: '',
      tipo: '',
      dataInicio: '',
      dataFim: '',
      termo: ''
    });
    // Recarregar ocorrências sem filtros
    carregarOcorrencias();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="listar-ocorrencias">
      <div className="page-header">
        <h1>Listar Ocorrências</h1>
        <Link to="/central/registrar" className="btn-primary">
          Nova Ocorrência
        </Link>
      </div>

      <div className="filtros-container">
        <form onSubmit={aplicarFiltros}>
          <div className="filtros-grid">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select 
                id="status" 
                name="status" 
                value={filtros.status} 
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="encerrada">Encerrada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="tipo">Tipo</label>
              <select 
                id="tipo" 
                name="tipo" 
                value={filtros.tipo} 
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                <option value="Acidente de trânsito">Acidente de trânsito</option>
                <option value="Furto">Furto</option>
                <option value="Roubo">Roubo</option>
                <option value="Homicídio">Homicídio</option>
                <option value="Lesão corporal">Lesão corporal</option>
                <option value="Perturbação do sossego">Perturbação do sossego</option>
                <option value="Violência doméstica">Violência doméstica</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="dataInicio">Data Início</label>
              <input 
                type="date" 
                id="dataInicio" 
                name="dataInicio" 
                value={filtros.dataInicio} 
                onChange={handleFiltroChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dataFim">Data Fim</label>
              <input 
                type="date" 
                id="dataFim" 
                name="dataFim" 
                value={filtros.dataFim} 
                onChange={handleFiltroChange}
              />
            </div>
            
            <div className="form-group search-group">
              <label htmlFor="termo">Buscar</label>
              <input 
                type="text" 
                id="termo" 
                name="termo" 
                value={filtros.termo} 
                onChange={handleFiltroChange}
                placeholder="Buscar por protocolo, endereço, solicitante..."
              />
            </div>
          </div>
          
          <div className="filtros-actions">
            <button type="button" className="btn-secondary" onClick={limparFiltros}>
              Limpar Filtros
            </button>
            <button type="submit" className="btn-primary">
              Aplicar Filtros
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="ocorrencias-table-container">
        {ocorrencias.length === 0 ? (
          <div className="no-data">
            <p>Nenhuma ocorrência encontrada.</p>
          </div>
        ) : (
          <table className="ocorrencias-table">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Tipo</th>
                <th>Data/Hora</th>
                <th>Local</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ocorrencias.map(ocorrencia => (
                <tr key={ocorrencia.id}>
                  <td>{ocorrencia.id}</td>
                  <td>{ocorrencia.tipo}</td>
                  <td>{new Date(ocorrencia.data_hora).toLocaleString()}</td>
                  <td>{ocorrencia.endereco}</td>
                  <td>
                    <span className={`status-badge status-${ocorrencia.status}`}>
                      {ocorrencia.status === 'aberta' && 'Aberta'}
                      {ocorrencia.status === 'em_andamento' && 'Em Andamento'}
                      {ocorrencia.status === 'encerrada' && 'Encerrada'}
                      {ocorrencia.status === 'cancelada' && 'Cancelada'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/central/ocorrencia/${ocorrencia.id}`} className="btn-action">
                        <span className="material-icons">visibility</span>
                      </Link>
                      <button className="btn-action">
                        <span className="material-icons">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ListarOcorrencias;