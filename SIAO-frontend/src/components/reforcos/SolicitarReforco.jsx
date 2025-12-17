import React, { useState } from 'react';
import './SolicitarReforco.css';

const SolicitarReforco = ({ ocorrencia, onSolicitar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nivelUrgencia: 3,
    tipoReforco: 'APOIO_GERAL',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);

  const tiposReforco = [
    { value: 'APOIO_GERAL', label: 'Apoio Geral' },
    { value: 'APOIO_ESPECIALIZADO', label: 'Apoio Especializado' },
    { value: 'BACKUP_URGENTE', label: 'Backup Urgente' },
    { value: 'PERICIA', label: 'Perícia' },
    { value: 'NEGOCIACAO', label: 'Negociação' },
    { value: 'RESGATE', label: 'Resgate' }
  ];

  const niveisUrgencia = [
    { value: 1, label: '1 - Baixa', color: '#28a745', description: 'Situação controlada' },
    { value: 2, label: '2 - Baixa-Média', color: '#6c757d', description: 'Apoio preventivo' },
    { value: 3, label: '3 - Média', color: '#ffc107', description: 'Situação padrão' },
    { value: 4, label: '4 - Alta', color: '#fd7e14', description: 'Situação crítica' },
    { value: 5, label: '5 - Crítica', color: '#dc3545', description: 'Emergência máxima' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dadosReforco = {
        ocorrenciaId: ocorrencia.id,
        ...formData
      };

      await onSolicitar(dadosReforco);
    } catch (error) {
      console.error('Erro ao solicitar reforço:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'nivelUrgencia' ? parseInt(value) : value
    }));
  };

  const nivelSelecionado = niveisUrgencia.find(n => n.value === formData.nivelUrgencia);

  return (
    <div className="solicitar-reforco">
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>🚨 Solicitar Reforço Policial</h3>
            <button 
              className="btn-close" 
              onClick={onCancelar}
              disabled={loading}
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            {/* Informações da Ocorrência */}
            <div className="ocorrencia-info">
              <h4>📋 Ocorrência</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Protocolo:</span>
                  <span className="value">{ocorrencia.protocolo}</span>
                </div>
                <div className="info-item">
                  <span className="label">Tipo:</span>
                  <span className="value">{ocorrencia.tipo}</span>
                </div>
                <div className="info-item">
                  <span className="label">Local:</span>
                  <span className="value">{ocorrencia.localizacao}</span>
                </div>
                <div className="info-item">
                  <span className="label">Status:</span>
                  <span className={`status ${ocorrencia.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {ocorrencia.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulário de Solicitação */}
            <form onSubmit={handleSubmit} className="reforco-form">
              {/* Nível de Urgência */}
              <div className="form-group">
                <label htmlFor="nivelUrgencia">
                  🚨 Nível de Urgência *
                </label>
                <div className="urgencia-selector">
                  {niveisUrgencia.map(nivel => (
                    <label 
                      key={nivel.value} 
                      className={`urgencia-option ${formData.nivelUrgencia === nivel.value ? 'selected' : ''}`}
                      style={{ borderColor: nivel.color }}
                    >
                      <input
                        type="radio"
                        name="nivelUrgencia"
                        value={nivel.value}
                        checked={formData.nivelUrgencia === nivel.value}
                        onChange={handleChange}
                      />
                      <div className="urgencia-content">
                        <div 
                          className="urgencia-indicator"
                          style={{ backgroundColor: nivel.color }}
                        />
                        <div className="urgencia-text">
                          <div className="urgencia-label">{nivel.label}</div>
                          <div className="urgencia-description">{nivel.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tipo de Reforço */}
              <div className="form-group">
                <label htmlFor="tipoReforco">
                  👥 Tipo de Reforço *
                </label>
                <select
                  id="tipoReforco"
                  name="tipoReforco"
                  value={formData.tipoReforco}
                  onChange={handleChange}
                  required
                >
                  {tiposReforco.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observações */}
              <div className="form-group">
                <label htmlFor="observacoes">
                  📝 Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Descreva detalhes sobre a necessidade do reforço..."
                  rows={4}
                />
              </div>

              {/* Resumo da Solicitação */}
              <div className="solicitacao-resumo">
                <h4>📊 Resumo da Solicitação</h4>
                <div className="resumo-content">
                  <div className="resumo-item">
                    <span className="resumo-label">Urgência:</span>
                    <span 
                      className="resumo-value urgencia"
                      style={{ color: nivelSelecionado?.color }}
                    >
                      {nivelSelecionado?.label}
                    </span>
                  </div>
                  <div className="resumo-item">
                    <span className="resumo-label">Tipo:</span>
                    <span className="resumo-value">
                      {tiposReforco.find(t => t.value === formData.tipoReforco)?.label}
                    </span>
                  </div>
                  {formData.observacoes && (
                    <div className="resumo-item">
                      <span className="resumo-label">Observações:</span>
                      <span className="resumo-value">{formData.observacoes}</span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancelar}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={`btn btn-primary ${formData.nivelUrgencia >= 4 ? 'urgente' : ''}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Solicitando...
                </>
              ) : (
                <>
                  🚨 Solicitar Reforço
                  {formData.nivelUrgencia >= 4 && ' (URGENTE)'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolicitarReforco;