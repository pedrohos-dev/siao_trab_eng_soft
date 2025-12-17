import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatarDistancia } from '../../utils/formatters';
import './MapaViatura.css';

// Corrigir o problema dos ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Ícones personalizados
const ocorrenciaIcon = new L.Icon({
  iconUrl: '/icons/ocorrencia-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const viaturaIcon = new L.Icon({
  iconUrl: '/icons/viatura-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Componente para atualizar a visualização do mapa
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

// Componente para desenhar a rota entre dois pontos
const RotaEntreMarkers = ({ posicaoViatura, posicaoOcorrencia }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!posicaoViatura || !posicaoOcorrencia) return;
    
    // Limpar rotas anteriores
    map.eachLayer(layer => {
      if (layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });
    
    // Desenhar nova rota
    const polyline = L.polyline(
      [
        [posicaoViatura.lat, posicaoViatura.lng],
        [posicaoOcorrencia.lat, posicaoOcorrencia.lng]
      ],
      { color: 'blue', weight: 3, opacity: 0.7, dashArray: '10, 10' }
    ).addTo(map);
    
    // Ajustar o mapa para mostrar toda a rota
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    
    return () => {
      map.removeLayer(polyline);
    };
  }, [map, posicaoViatura, posicaoOcorrencia]);
  
  return null;
};

const MapaViatura = ({ despacho, posicaoAtual }) => {
  const [posicaoViatura, setPosicaoViatura] = useState(null);
  const [posicaoOcorrencia, setPosicaoOcorrencia] = useState(null);
  const [distancia, setDistancia] = useState(null);
  
  useEffect(() => {
    if (posicaoAtual) {
      setPosicaoViatura({
        lat: posicaoAtual.latitude,
        lng: posicaoAtual.longitude
      });
    }
    
    if (despacho && despacho.ocorrencia) {
      setPosicaoOcorrencia({
        lat: despacho.ocorrencia.latitude,
        lng: despacho.ocorrencia.longitude
      });
    }
  }, [despacho, posicaoAtual]);
  
  // Calcular distância entre viatura e ocorrência
  useEffect(() => {
    if (posicaoViatura && posicaoOcorrencia) {
      const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      const dist = calcularDistancia(
        posicaoViatura.lat,
        posicaoViatura.lng,
        posicaoOcorrencia.lat,
        posicaoOcorrencia.lng
      );
      
      setDistancia(dist);
    }
  }, [posicaoViatura, posicaoOcorrencia]);
  
  // Definir centro inicial do mapa
  const centro = posicaoOcorrencia || posicaoViatura || [-19.9167, -43.9345]; // Belo Horizonte como padrão
  const zoom = 15;
  
  return (
    <div className="mapa-viatura-container">
      <div className="mapa-info">
        {distancia !== null && (
          <div className="distancia-info">
            <i className="material-icons">straighten</i>
            <span>Distância: {formatarDistancia(distancia)}</span>
          </div>
        )}
        
        {despacho && despacho.ocorrencia && (
          <div className="ocorrencia-info">
            <i className="material-icons">location_on</i>
            <span>{despacho.ocorrencia.localizacao}</span>
          </div>
        )}
      </div>
      
      <MapContainer
        center={[centro.lat || centro[0], centro.lng || centro[1]]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {posicaoViatura && (
          <Marker position={[posicaoViatura.lat, posicaoViatura.lng]} icon={viaturaIcon}>
            <Popup>
              <div>
                <strong>Sua posição atual</strong>
                <br />
                Lat: {posicaoViatura.lat.toFixed(6)}
                <br />
                Lng: {posicaoViatura.lng.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}
        
        {posicaoOcorrencia && (
          <Marker position={[posicaoOcorrencia.lat, posicaoOcorrencia.lng]} icon={ocorrenciaIcon}>
            <Popup>
              <div>
                <strong>{despacho.ocorrencia.tipo}</strong>
                <br />
                {despacho.ocorrencia.localizacao}
                <br />
                Protocolo: {despacho.ocorrencia.protocolo}
              </div>
            </Popup>
          </Marker>
        )}
        
        {posicaoViatura && posicaoOcorrencia && (
          <RotaEntreMarkers 
            posicaoViatura={posicaoViatura} 
            posicaoOcorrencia={posicaoOcorrencia} 
          />
        )}
        
        <MapUpdater center={centro} zoom={zoom} />
      </MapContainer>
    </div>
  );
};

export default MapaViatura;