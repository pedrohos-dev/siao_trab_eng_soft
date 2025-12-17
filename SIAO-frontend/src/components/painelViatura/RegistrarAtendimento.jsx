import React, { useState } from 'react';
import './RegistrarAtendimento.css';

const RegistrarAtendimento = ({ despacho, onClose, onSalvar }) => {
  const [acoes, setAcoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acoes.trim()) {
      setError('Por favor, descreva as ações realizadas');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSalvar(acoes);
    } catch (error) {
      setError('Erro ao salvar ações');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registrar-atendimento-overlay">
      <div className="registrar-atendimento-modal">
        <div className="modal-header">
          <h2>Registrar Ações</h2>
          <button className="close-button" onClick={onClose}>
            <i className="material-icons">close</i>
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="acoes">Descreva detalhadamente as ações realizadas:</label>
              <textarea
                id="acoes"
                value={acoes}
                onChange={(e) => setAcoes(e.target.value)}
                rows={8}
                placeholder="Ex: Chegada ao local às 15:30. Vítima com ferimentos leves. Acionado SAMU. Suspeito detido e conduzido à delegacia..."
                disabled={isSubmitting}
                className={error ? 'input-error' : ''}
              ></textarea>
              {error && <div className="error-message">{error}</div>}
              <div className="contador-caracteres">
                {acoes.length} caracteres
              </div>
            </div>
            
            <div className="acoes-sugestoes">
              <h4>Sugestões de informações importantes:</h4>
              <ul>
                <li>Situação encontrada no local</li>
                <li>Vítimas (quantidade, estado)</li>
                <li>Outros órgãos acionados (SAMU, Bombeiros)</li>
                <li>Procedimentos realizados</li>
                <li>Encaminhamentos (hospital, delegacia)</li>
                <li>Testemunhas</li>
              </ul>
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button 
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Ações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrarAtendimento;