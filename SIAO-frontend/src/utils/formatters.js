// Formatar data e hora
export const formatarDataHora = (dataString) => {
  if (!dataString) return '';
  
  const data = new Date(dataString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
};

// Formatar apenas data
export const formatarData = (dataString) => {
  if (!dataString) return '';
  
  const data = new Date(dataString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(data);
};

// Formatar apenas hora
export const formatarHora = (dataString) => {
  if (!dataString) return '';
  
  const data = new Date(dataString);
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(data);
};

// Formatar tempo decorrido
export const formatarTempoDecorrido = (dataString) => {
  if (!dataString) return '';
  
  const data = new Date(dataString);
  const agora = new Date();
  const diferencaMs = agora - data;
  
  const segundos = Math.floor(diferencaMs / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  
  if (dias > 0) {
    return `${dias} dia${dias > 1 ? 's' : ''} atrás`;
  } else if (horas > 0) {
    return `${horas} hora${horas > 1 ? 's' : ''} atrás`;
  } else if (minutos > 0) {
    return `${minutos} minuto${minutos > 1 ? 's' : ''} atrás`;
  } else {
    return 'Agora mesmo';
  }
};

// Formatar distância
export const formatarDistancia = (distanciaKm) => {
  if (distanciaKm === null || distanciaKm === undefined) return '';
  
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} m`;
  } else {
    return `${distanciaKm.toFixed(1)} km`;
  }
};

// Formatar velocidade
export const formatarVelocidade = (velocidadeKmh) => {
  if (velocidadeKmh === null || velocidadeKmh === undefined) return '0 km/h';
  return `${Math.round(velocidadeKmh)} km/h`;
};

// Formatar telefone
export const formatarTelefone = (telefone) => {
  if (!telefone) return '';
  
  // Remover caracteres não numéricos
  const numeros = telefone.replace(/\D/g, '');
  
  // Formatar conforme o tamanho
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  } else if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  } else {
    return telefone;
  }
};

// Formatar protocolo
export const formatarProtocolo = (protocolo) => {
  if (!protocolo) return '';
  return protocolo.toUpperCase();
};