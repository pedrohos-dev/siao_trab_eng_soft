const db = require('../database/jsonDatabase');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Iniciando seed de dados mockados...');

  // Limpar dados existentes
  ['orgaos', 'usuarios', 'viaturas', 'ocorrencias', 'despachos', 
   'geolocalizacao', 'painelViaturas', 'centralChamadas', 'logs', 'reforcosPolicia'].forEach(collection => {
    db.clear(collection);
  });

  // 1. Criar Órgãos
  const pmmg = db.create('orgaos', {
    nome: 'Polícia Militar de Minas Gerais',
    sigla: 'PMMG',
    tipo: 'Polícia Militar',
    telefone: '190',
    endereco: 'Av. Amazonas, 1000 - Belo Horizonte',
    ativo: true
  });

  const dhpp = db.create('orgaos', {
    nome: 'Departamento de Homicídios e Proteção à Pessoa',
    sigla: 'DHPP',
    tipo: 'Delegacia',
    telefone: '(31) 3333-3333',
    endereco: 'Rua da Paz, 500 - Belo Horizonte',
    ativo: true
  });

  console.log('✅ Órgãos criados');

  // 2. Criar Usuários
  const senhaHash = bcrypt.hashSync('senha123', 10);

  const operadorCentral = db.create('usuarios', {
    nome: 'Operador Central',
    email: 'operador@central.gov.br',
    senha: senhaHash,
    perfil: 'Central',
    ativo: true,
    orgaoId: null
  });

  const sgtSilva = db.create('usuarios', {
    nome: 'Sgt. Silva',
    email: 'silva@pmmg.gov.br',
    senha: senhaHash,
    perfil: 'PMMG',
    ativo: true,
    orgaoId: pmmg.id
  });

  const delegadoCosta = db.create('usuarios', {
    nome: 'Delegado Costa',
    email: 'costa@dhpp.gov.br',
    senha: senhaHash,
    perfil: 'DHPP',
    ativo: true,
    orgaoId: dhpp.id
  });

  const policialViatura = db.create('usuarios', {
    nome: 'Policial Viatura 01',
    email: 'viatura01@pmmg.gov.br',
    senha: senhaHash,
    perfil: 'Policial',
    ativo: true,
    orgaoId: pmmg.id
  });

  const adminSistema = db.create('usuarios', {
    nome: 'Admin Sistema',
    email: 'admin@siao.gov.br',
    senha: senhaHash,
    perfil: 'Administrador',
    ativo: true,
    orgaoId: null
  });

  // NOVO: Usuário Sistema de Chamadas
  const sistemaChamadas = db.create('usuarios', {
    nome: 'Sistema de Chamadas',
    email: 'sistema@chamadas.gov.br',
    senha: senhaHash,
    perfil: 'Sistema',
    ativo: true,
    orgaoId: null
  });

  console.log('✅ Usuários criados (senha padrão: senha123)');

  // 3. Criar Viaturas
  const viatura1 = db.create('viaturas', {
    placa: 'ABC-1234',
    prefixo: 'PM-001',
    tipo: 'Patrulha',
    status: 'Disponível',
    orgaoId: pmmg.id
  });

  const viatura2 = db.create('viaturas', {
    placa: 'DEF-5678',
    prefixo: 'PM-002',
    tipo: 'Patrulha',
    status: 'Disponível',
    orgaoId: pmmg.id
  });

  const viatura3 = db.create('viaturas', {
    placa: 'GHI-9012',
    prefixo: 'DHPP-001',
    tipo: 'Perícia',
    status: 'Disponível',
    orgaoId: dhpp.id
  });

  const viatura4 = db.create('viaturas', {
    placa: 'JKL-3456',
    prefixo: 'PM-003',
    tipo: 'Patrulha',
    status: 'Manutenção',
    orgaoId: pmmg.id
  });

  console.log('✅ Viaturas criadas');

  // 4. Criar Geolocalizações das Viaturas
  db.create('geolocalizacao', {
    viaturaId: viatura1.id,
    latitude: -19.9167,
    longitude: -43.9345,
    velocidade: 0,
    dataHoraAtualizacao: new Date().toISOString()
  });

  db.create('geolocalizacao', {
    viaturaId: viatura2.id,
    latitude: -19.9200,
    longitude: -43.9400,
    velocidade: 0,
    dataHoraAtualizacao: new Date().toISOString()
  });

  db.create('geolocalizacao', {
    viaturaId: viatura3.id,
    latitude: -19.9250,
    longitude: -43.9450,
    velocidade: 0,
    dataHoraAtualizacao: new Date().toISOString()
  });

  console.log('✅ Geolocalizações criadas');

  // 5. Criar Painéis de Viaturas
  [viatura1, viatura2, viatura3, viatura4].forEach(viatura => {
    db.create('painelViaturas', {
      viaturaId: viatura.id,
      statusOperacional: viatura.status === 'Disponível' ? 'Em Patrulha' : 'Indisponível',
      ultimaAtualizacao: new Date().toISOString(),
      observacoes: ''
    });
  });

  console.log('✅ Painéis de viaturas criados');

  // 6. Criar algumas Ocorrências de Exemplo com Estados da Máquina
  const chamada1 = db.create('centralChamadas', {
    nomeChamador: 'Maria Santos',
    telefoneChamador: '(31) 98888-8888',
    enderecoChamador: 'Rua das Flores, 100',
    dataHoraChamada: new Date().toISOString(),
    observacoes: 'Ligação clara, vítima em pânico'
  });

  const ocorrencia1 = db.create('ocorrencias', {
    protocolo: 'OC-2025-00001',
    tipo: 'Assalto',
    descricao: 'Assalto à mão armada em andamento',
    localizacao: 'Rua das Flores, 100 - Centro',
    latitude: -19.9180,
    longitude: -43.9360,
    status: 'Ocorrência aberta', // Estado da máquina
    dataHoraRegistro: new Date().toISOString(),
    dataHoraEncerramento: null,
    orgaoId: pmmg.id,
    centralChamadasId: chamada1.id,
    ultimaTransicao: new Date().toISOString()
  });

  const chamada2 = db.create('centralChamadas', {
    nomeChamador: 'João Pereira',
    telefoneChamador: '(31) 97777-7777',
    enderecoChamador: 'Av. Brasil, 500',
    dataHoraChamada: new Date().toISOString(),
    observacoes: 'Testemunha de acidente'
  });

  const ocorrencia2 = db.create('ocorrencias', {
    protocolo: 'OC-2025-00002',
    tipo: 'Acidente de Trânsito',
    descricao: 'Colisão entre dois veículos, sem vítimas graves',
    localizacao: 'Av. Brasil, 500 - Savassi',
    latitude: -19.9300,
    longitude: -43.9500,
    status: 'Despachada', // Estado da máquina
    dataHoraRegistro: new Date().toISOString(),
    dataHoraEncerramento: null,
    orgaoId: pmmg.id,
    centralChamadasId: chamada2.id,
    ultimaTransicao: new Date().toISOString()
  });

  const chamada3 = db.create('centralChamadas', {
    nomeChamador: 'Carlos Mendes',
    telefoneChamador: '(31) 96666-6666',
    enderecoChamador: 'Praça da Liberdade, s/n',
    dataHoraChamada: new Date().toISOString(),
    observacoes: 'Homicídio - local preservado'
  });

  const ocorrencia3 = db.create('ocorrencias', {
    protocolo: 'OC-2025-00003',
    tipo: 'Homicídio',
    descricao: 'Corpo encontrado na praça',
    localizacao: 'Praça da Liberdade - Centro',
    latitude: -19.9320,
    longitude: -43.9380,
    status: 'Viatura Solicitada', // Estado da máquina
    dataHoraRegistro: new Date().toISOString(),
    dataHoraEncerramento: null,
    orgaoId: dhpp.id,
    centralChamadasId: chamada3.id,
    ultimaTransicao: new Date().toISOString()
  });

  console.log('✅ Ocorrências mockadas criadas');

  // 7. Criar despachos de exemplo
  const despacho1 = db.create('despachos', {
    ocorrenciaId: ocorrencia1.id,
    viaturaId: viatura1.id,
    dataHoraDespacho: new Date().toISOString(),
    dataHoraChegada: null,
    status: 'Enviada',
    observacoes: 'Viatura mais próxima despachada',
    acoes: '',
    distanciaKm: 2.5
  });

  const despacho2 = db.create('despachos', {
    ocorrenciaId: ocorrencia2.id,
    viaturaId: viatura2.id,
    dataHoraDespacho: new Date().toISOString(),
    dataHoraChegada: new Date().toISOString(),
    dataHoraInicioAtendimento: new Date().toISOString(),
    status: 'Em Atendimento',
    observacoes: 'Atendimento em andamento',
    acoes: 'Isolamento da área, coleta de dados dos envolvidos',
    distanciaKm: 1.8
  });

  console.log('✅ Despachos mockados criados');

  // 8. NOVO: Criar Reforços Policiais mockados
  const reforco1 = db.create('reforcosPolicia', {
    ocorrenciaId: ocorrencia1.id,
    solicitadoPor: policialViatura.id,
    nivelUrgencia: 3,
    dataHoraSolicitacao: new Date().toISOString(),
    status: 'Pendente'
  });

  const reforco2 = db.create('reforcosPolicia', {
    ocorrenciaId: ocorrencia2.id,
    solicitadoPor: sgtSilva.id,
    nivelUrgencia: 2,
    dataHoraSolicitacao: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min atrás
    status: 'Atendido'
  });

  console.log('✅ Reforços policiais mockados criados');

  // 9. NOVO: Criar Logs de Transições de Estado
  db.create('logs', {
    tipo: 'TRANSICAO_ESTADO',
    ocorrenciaId: ocorrencia1.id,
    estadoAnterior: 'Inicial',
    novoEstado: 'Ocorrência aberta',
    observacoes: 'Ocorrência registrada no sistema',
    timestamp: new Date().toISOString()
  });

  db.create('logs', {
    tipo: 'NOVA_OCORRENCIA',
    ocorrenciaId: ocorrencia1.id,
    orgaoId: pmmg.id,
    protocolo: ocorrencia1.protocolo,
    timestamp: new Date().toISOString()
  });

  db.create('logs', {
    tipo: 'TRANSICAO_ESTADO',
    ocorrenciaId: ocorrencia2.id,
    estadoAnterior: 'Viatura Solicitada',
    novoEstado: 'Despachada',
    observacoes: 'Viatura PM-002 despachada',
    timestamp: new Date().toISOString()
  });

  db.create('logs', {
    tipo: 'REFORCO_SOLICITADO',
    ocorrenciaId: ocorrencia1.id,
    reforcoId: reforco1.id,
    nivelUrgencia: 3,
    timestamp: new Date().toISOString()
  });

  console.log('✅ Logs de auditoria criados');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Resumo:');
  console.log(`   - 2 Órgãos (PMMG, DHPP)`);
  console.log(`   - 6 Usuários (incluindo Sistema)`);
  console.log(`   - 4 Viaturas`);
  console.log(`   - 3 Ocorrências (com estados da máquina)`);
  console.log(`   - 2 Despachos`);
  console.log(`   - 2 Reforços Policiais`);
  console.log(`   - 4 Logs de auditoria`);
  console.log('\n👤 Logins disponíveis:');
  console.log('   - operador@central.gov.br / senha123 (Central)');
  console.log('   - silva@pmmg.gov.br / senha123 (PMMG)');
  console.log('   - costa@dhpp.gov.br / senha123 (DHPP)');
  console.log('   - viatura01@pmmg.gov.br / senha123 (Policial)');
  console.log('   - admin@siao.gov.br / senha123 (Admin)');
  console.log('   - sistema@chamadas.gov.br / senha123 (Sistema)');
  console.log('\n🔄 Estados das Ocorrências:');
  console.log('   - OC-2025-00001: Ocorrência aberta (Assalto)');
  console.log('   - OC-2025-00002: Despachada (Acidente)');
  console.log('   - OC-2025-00003: Viatura Solicitada (Homicídio)');
  console.log('\n🚨 Reforços Policiais:');
  console.log('   - Reforço nível 3 pendente (Assalto)');
  console.log('   - Reforço nível 2 atendido (Acidente)\n');
}

seed().catch(console.error);