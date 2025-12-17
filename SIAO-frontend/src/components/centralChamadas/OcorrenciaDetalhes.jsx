import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ocorrenciaService } from '../../services/ocorrenciaService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../shared/LoadingSpinner';
import './OcorrenciaDetalhes.css';

const OcorrenciaDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ocorrencia, setOcorrencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const carregarOcorrencia = async () => {
      try {
        setLoading(true);
        const data = await ocorrenciaService.obterPorId(id);
        setOcorrencia(data);
      } catch (error) {
        console.error(`Erro ao carregar ocorrência ${id}:`, error);
        setError('Falha ao carregar detalhes da ocorrência. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    carregarOcorrencia();
  }, [id]);

  const handleStatusChange = async (novoStatus) => {
    try {
      setLoading(true);
      await ocorrenciaService.atualizar(id, { status: novoStatus });
      setOcorrencia(prev => ({ ...prev, status: novoStatus }));
      toast.success(`Status atualizado para ${novoStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da ocorrência');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="error-container">
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/central')} className="btn-primary">
          Voltar
        </button>
      </div>
    );
  }

  if (!ocorrencia) {
    return (
      <div className="not-found-container">
        <h2>Ocorrência não encontrada</h2>
        <p>A ocorrência solicitada não existe ou foi removida.</p>
        <button onClick={() => navigate('/central')} className="btn-primary">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="ocorrencia-detalhes">
      <div className="page-header">
        <h1>Ocorrência #{ocorrencia.id}</h1>
        <button onClick={() => navigate('/central')} className="btn-secondary">
          Voltar
        </button>
      </div>

      <div className="detalhes-container">
        <div className="detalhes-header">
          <div className="detalhes-status">
            <span className={`status-badge status-${ocorrencia.status}`}>
              {ocorrencia.status === 'aberta' && 'Aberta'}
              {ocorrencia.status === 'em_andamento' && 'Em Andamento'}
              {ocorrencia.status === 'encerrada' && 'Encerrada'}
              {ocorrencia.status === 'cancelada' && 'Cancelada'}
            </span>
          </div>
          <div className="detalhes-acoes">
            <button 
              className="btn-status" 
              onClick={() => handleStatusChange('aberta')}
              disabled={ocorrencia.status === 'aberta'}
            >
              Marcar como Aberta
            </button>
            <button 
              className="btn-status" 
              onClick={() => handleStatusChange('em_andamento')}
              disabled={ocorrencia.status === 'em_andamento'}
            >
              Marcar Em Andamento
            </button>
            <button 
              className="btn-status" 
              onClick={() => handleStatusChange('encerrada')}
              disabled={ocorrencia.status === 'encerrada'}
            >
              Marcar como Encerrada
            </button>
            <button 
              className="btn-status btn-cancelar" 
              onClick={() => handleStatusChange('cancelada')}
              disabled={ocorrencia.status === 'cancelada'}
            >
              Cancelar Ocorrência
            </button>
          </div>
        </div>

        <div className="detalhes-section">
          <h2>Informações da Ocorrência</h2>
          <div className="detalhes-grid">
            <div className="detalhes-item">
              <span className="detalhes-label">Tipo:</span>
              <span className="detalhes-value">{ocorrencia.tipo}</span>
            </div>
            <div className="detalhes-item">
              <span className="detalhes-label">Prioridade:</span>
              <span className="detalhes-value">{ocorrencia.prioridade}</span>
            </div>
            <div className="detalhes-item">
              <span className="detalhes-label">Data/Hora:</span>
              <span className="detalhes-value">{new Date(ocorrencia.data_hora).toLocaleString()}</span>
            </div>
            <div className="detalhes-item">
              <span className="detalhes-label">Órgão Responsável:</span>
              <span className="detalhes-value">{ocorrencia.orgao_responsavel || 'Não definido'}</span>
            </div>
          </div>
          <div className="detalhes-item full-width">
            <span className="detalhes-label">Descrição:</span>
            <p className="detalhes-value">{ocorrencia.descricao}</p>
          </div>
        </div>

        <div className="detalhes-section">
          <h2>Local da Ocorrência</h2>
          <div className="detalhes-grid">
            <div className="detalhes-item full-width">
              <span className="detalhes-label">Endereço:</span>
              <span className="detalhes-value">{ocorrencia.endereco}</span>
            </div>
            <div className="detalhes-item">
              <span className="detalhes-label">Bairro:</span>
              <span className="detalhes-value">{ocorrencia.bairro || 'Não informado'}</span>
            </div>
            <div className="detalhes-item">
              <span className="detalhes-label">Cidade:</span>
              <span className="detalhes-value">{ocorrencia.cidade}</span>
            </div>
            <div className="detalhes-item">
              <span className="detalhes-label">Estado:</span>
              <span className="detalhes-value">{ocorrencia.estado}</span>
            </div>
          </div>
        </div>

        <div className="detalhes-section">
          <h2>Dados do Solicitante</h2>
          <div className="detalhes-grid">
            <div className="detalhes-item">
              <span className="detalhes-label">Nome:</span>
              <span className="detalhes-value">{ocorrencia.solicitante || 'Não informado'}</span>
            </div>
            <div className="detalhes-item">
              <span className="detalhes-label">Telefone:</span>
              <span className="detalhes-value">{ocorrencia.telefone || 'Não informado'}</span>
            </div>
          </div>
        </div>

        <div className="detalhes-section">
          <h2>Atendimento</h2>
          {ocorrencia.despachos && ocorrencia.despachos.length > 0 ? (
            <div className="despachos-list">
              {ocorrencia.despachos.map(despacho => (
                <div key={despacho.id} className="despacho-item">
                  <div className="despacho-header">
                    <h3>Viatura {despacho.viatura_codigo}</h3>
                    <span className={`status-badge status-${despacho.status}`}>
                      {despacho.status}
                    </span>
                  </div>
                  <div className="despacho-body">
                    <p><strong>Despachado em:</strong> {new Date(despacho.data_hora_despacho).toLocaleString()}</p>
                    {despacho.data_hora_chegada && (
                      <p><strong>Chegada ao local:</strong> {new Date(despacho.data_hora_chegada).toLocaleString()}</p>
                    )}
                    {despacho.acoes && (
                      <p><strong>Ações realizadas:</strong> {despacho.acoes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhuma viatura despachada para esta ocorrência.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OcorrenciaDetalhes;