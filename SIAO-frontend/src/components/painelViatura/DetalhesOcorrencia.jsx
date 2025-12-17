import React from 'react';
import { formatarDataHora } from '../../utils/formatters';
import './DetalhesOcorrencia.css';

const DetalhesOcorrencia = ({ despacho }) => {
  if (!despacho || !despacho.ocorrencia) {
    return (
      <div className="detalhes-ocorrencia">
        <div className="card-erro">
          <p>Não foi possível carregar os detalhes da ocorrência.</p>
        </div>
      </div>
    );
  }

  const { ocorrencia } = despacho;

  return (
    <div className="detalhes-ocorrencia">
      <div className="card-ocorrencia">
        <div className="protocolo-badge">
          Protocolo: <strong>{ocorrencia.protocolo}</strong>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Tipo:</span>
            <span className="info-value tipo-badge">{ocorrencia.tipo}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className={`info-value status-badge status-${despacho.status?.toLowerCase().replace(' ', '-')}`}>
              {despacho.status}
            </span>
          </div>

          <div className="info-item full-width">
            <span className="info-label">Local:</span>
            <span className="info-value">{ocorrencia.localizacao}</span>
          </div>

          <div className="info-item full-width">
            <span className="info-label">Descrição:</span>
            <p className="info-value descricao">{ocorrencia.descricao}</p>
          </div>

          <div className="info-item">
            <span className="info-label">Data/Hora:</span>
            <span className="info-value">{formatarDataHora(ocorrencia.dataHoraRegistro)}</span>
          </div>

          {despacho.dataHoraChegada && (
            <div className="info-item">
              <span className="info-label">Chegada:</span>
              <span className="info-value">{formatarDataHora(despacho.dataHoraChegada)}</span>
            </div>
          )}
        </div>

        {ocorrencia.centralChamada && (
          <div className="chamador-info">
            <h3>Dados do Chamador</h3>
            <div className="info-grid">
              <div className="info-item full-width">
                <span className="info-label">Nome:</span>
                <span className="info-value">{ocorrencia.centralChamada.nomeChamador}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Telefone:</span>
                <span className="info-value">{ocorrencia.centralChamada.telefoneChamador}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">Endereço:</span>
                <span className="info-value">{ocorrencia.centralChamada.enderecoChamador}</span>
              </div>
            </div>
          </div>
        )}

        {despacho.acoes && despacho.acoes.length > 0 && (
          <div className="acoes-registradas">
            <h3>Ações Registradas</h3>
            <ul>
              {despacho.acoes.map((acao, index) => (
                <li key={index}>
                  <div className="acao-timestamp">{formatarDataHora(acao.dataHora)}</div>
                  <div className="acao-descricao">{acao.descricao}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalhesOcorrencia;