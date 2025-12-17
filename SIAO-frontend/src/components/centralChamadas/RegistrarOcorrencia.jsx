import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ocorrenciaService } from '../../services/ocorrenciaService';
import { toast } from 'react-toastify';
import './RegistrarOcorrencia.css';

const RegistrarOcorrencia = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: '',
    descricao: '',
    endereco: '',
    bairro: '',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    solicitante: '',
    telefone: '',
    prioridade: 'media'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tipo || !formData.descricao || !formData.endereco) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      setLoading(true);
      const novaOcorrencia = await ocorrenciaService.criar(formData);
      toast.success(`Ocorrência registrada com sucesso! Protocolo: ${novaOcorrencia.id}`);
      navigate('/central');
    } catch (error) {
      console.error('Erro ao registrar ocorrência:', error);
      toast.error('Erro ao registrar ocorrência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registrar-ocorrencia">
      <div className="page-header">
        <h1>Registrar Nova Ocorrência</h1>
        <button 
          className="btn-secondary"
          onClick={() => navigate('/central')}
        >
          Voltar
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Informações da Ocorrência</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tipo">Tipo de Ocorrência *</label>
                <select 
                  id="tipo" 
                  name="tipo" 
                  value={formData.tipo} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Acidente de trânsito">Acidente de trânsito</option>
                  <option value="Furto">Furto</option>
                  <option value="Roubo">Roubo</option>
                  <option value="Homicídio">Homicídio</option>
                  <option value="Lesão corporal">Lesão corporal</option>
                  <option value="Perturbação do sossego">Perturbação do sossego</option>
                  <option value="Violência doméstica">Violência doméstica</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="prioridade">Prioridade</label>
                <select 
                  id="prioridade" 
                  name="prioridade" 
                  value={formData.prioridade} 
                  onChange={handleChange}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="descricao">Descrição *</label>
              <textarea 
                id="descricao" 
                name="descricao" 
                value={formData.descricao} 
                onChange={handleChange}
                rows="4"
                required
                placeholder="Descreva detalhadamente a ocorrência..."
              ></textarea>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Local da Ocorrência</h2>
            
            <div className="form-group">
              <label htmlFor="endereco">Endereço *</label>
              <input 
                type="text" 
                id="endereco" 
                name="endereco" 
                value={formData.endereco} 
                onChange={handleChange}
                required
                placeholder="Rua, número, complemento"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bairro">Bairro</label>
                <input 
                  type="text" 
                  id="bairro" 
                  name="bairro" 
                  value={formData.bairro} 
                  onChange={handleChange}
                  placeholder="Bairro"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cidade">Cidade</label>
                <input 
                  type="text" 
                  id="cidade" 
                  name="cidade" 
                  value={formData.cidade} 
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="estado">Estado</label>
                <input 
                  type="text" 
                  id="estado" 
                  name="estado" 
                  value={formData.estado} 
                  onChange={handleChange}
                  maxLength="2"
                />
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Dados do Solicitante</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="solicitante">Nome do Solicitante</label>
                <input 
                  type="text" 
                  id="solicitante" 
                  name="solicitante" 
                  value={formData.solicitante} 
                  onChange={handleChange}
                  placeholder="Nome completo"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input 
                  type="tel" 
                  id="telefone" 
                  name="telefone" 
                  value={formData.telefone} 
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/central')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Ocorrência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrarOcorrencia;
