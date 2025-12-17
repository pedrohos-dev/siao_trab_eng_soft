// Status de ocorrências
export const STATUS_OCORRENCIA = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em Andamento',
  ENCERRADA: 'Encerrada',
  CANCELADA: 'Cancelada'
};

// Status de despachos
export const STATUS_DESPACHO = {
  ENVIADA: 'Enviada',
  EM_CAMPO: 'Em Campo',
  NO_LOCAL: 'No Local',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado'
};

// Status de viaturas
export const STATUS_VIATURA = {
  DISPONIVEL: 'Disponível',
  EM_DESLOCAMENTO: 'Em Deslocamento',
  NO_LOCAL: 'No Local',
  MANUTENCAO: 'Manutenção',
  INDISPONIVEL: 'Indisponível'
};

// Tipos de ocorrências
export const TIPOS_OCORRENCIA = [
  'Acidente de Trânsito',
  'Assalto',
  'Furto',
  'Homicídio',
  'Lesão Corporal',
  'Perturbação do Sossego',
  'Roubo',
  'Sequestro',
  'Tráfico de Drogas',
  'Violência Doméstica',
  'Outros'
];

// Tipos de viaturas
export const TIPOS_VIATURA = [
  'Patrulha',
  'Perícia',
  'Investigação',
  'Apoio Tático',
  'Motocicleta',
  'Transporte'
];

// Perfis de usuário
export const PERFIS_USUARIO = [
  'Central',
  'PMMG',
  'DHPP',
  'Policial',
  'Administrador'
];

// Cores para status
export const CORES_STATUS = {
  'Aberta': '#ff9800',
  'Em Andamento': '#2196f3',
  'Encerrada': '#4caf50',
  'Cancelada': '#f44336',
  'Enviada': '#ff9800',
  'Em Campo': '#2196f3',
  'No Local': '#9c27b0',
  'Concluído': '#4caf50',
  'Disponível': '#4caf50',
  'Em Deslocamento': '#2196f3',
  'Manutenção': '#f44336',
  'Indisponível': '#9e9e9e'
};

// Configurações do mapa
export const MAPA_CONFIG = {
  ZOOM_PADRAO: 13,
  CENTRO_PADRAO: [-19.9167, -43.9345], // Belo Horizonte
  RAIO_PADRAO: 10 // km
};