// Validar email
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validar senha (mínimo 6 caracteres)
export const validarSenha = (senha) => {
  return senha && senha.length >= 6;
};

// Validar telefone
export const validarTelefone = (telefone) => {
  const numeros = telefone.replace(/\D/g, '');
  return numeros.length >= 10 && numeros.length <= 11;
};

// Validar se campo está vazio
export const validarCampoVazio = (valor) => {
  return valor !== null && valor !== undefined && valor.trim() !== '';
};

// Validar coordenadas geográficas
export const validarCoordenadas = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// Validar placa de veículo (padrão brasileiro)
export const validarPlaca = (placa) => {
  // Aceita tanto o formato antigo (ABC-1234) quanto o Mercosul (ABC1D23)
  const regexAntiga = /^[A-Z]{3}-\d{4}$/;
  const regexMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;
  
  return regexAntiga.test(placa) || regexMercosul.test(placa);
};

// Validar data
export const validarData = (dataString) => {
  if (!dataString) return false;
  
  const data = new Date(dataString);
  return !isNaN(data.getTime());
};

// Validar período (data início e fim)
export const validarPeriodo = (dataInicio, dataFim) => {
  if (!dataInicio || !dataFim) return false;
  
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  
  return !isNaN(inicio.getTime()) && 
         !isNaN(fim.getTime()) && 
         inicio <= fim;
};