const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const { port, corsOrigin } = require('./config/environment');
const setupWebSocket = require('./websocket/socketHandler');

// Importar rotas existentes
const ocorrenciasRoutes = require('./routes/ocorrencias');
const centralChamadasRoutes = require('./routes/centralChamadas');
const despachosRoutes = require('./routes/despachos');
const viaturasRoutes = require('./routes/viaturas');
const orgaosRoutes = require('./routes/orgaos');
const geolocalizacaoRoutes = require('./routes/geolocalizacao');
const usuariosRoutes = require('./routes/usuarios');
const relatoriosRoutes = require('./routes/relatorios');
const authRoutes = require('./routes/auth');

// Importar novas rotas
const reforcosRoutes = require('./routes/reforcos');
const integracaoRoutes = require('./routes/integracao');

// Inicializar Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configurar middlewares
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Adicionar io ao objeto req para uso nos controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configurar rotas existentes
app.use('/api/auth', authRoutes);
app.use('/api/ocorrencias', ocorrenciasRoutes);
app.use('/api/centralChamadas', centralChamadasRoutes);
app.use('/api/despachos', despachosRoutes);
app.use('/api/viaturas', viaturasRoutes);
app.use('/api/orgaos', orgaosRoutes);
app.use('/api/geolocalizacao', geolocalizacaoRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Configurar novas rotas
app.use('/api/reforcos', reforcosRoutes);
app.use('/api/integracao', integracaoRoutes);

// Rota de status expandida
app.get('/api/status', (req, res) => {
  const db = require('./database/jsonDatabase');
  
  // Estatísticas básicas
  const stats = {
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    componentes: {
      'integracao-chamadas': 'ativo',
      'gerenciamento-ocorrencias': 'ativo',
      'geolocalizacao': 'ativo',
      'atendimento-dhpp': 'ativo',
      'comunicacao-policial': 'ativo',
      'sistema-reforcos': 'ativo'
    },
    estatisticas: {
      ocorrencias: db.findAll('ocorrencias').length,
      viaturas: db.findAll('viaturas').length,
      usuarios: db.findAll('usuarios').length,
      reforcosPolicia: db.findAll('reforcosPolicia').length,
      logs: db.findAll('logs').length
    }
  };

  res.json(stats);
});

// Rota de saúde dos componentes
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'ok',
      websocket: 'ok',
      authentication: 'ok',
      integracaoChamadas: 'ok',
      sistemaReforcos: 'ok'
    },
    uptime: process.uptime()
  };

  res.json(healthCheck);
});

// Middleware de tratamento de erros
app.use(errorLogger);
app.use(errorHandler);

// Inicializar WebSocket
setupWebSocket(io);

// Iniciar servidor
server.listen(port, () => {
  console.log(`🚀 Servidor SIAO rodando na porta ${port}`);
  console.log(`📡 WebSocket ativo`);
  console.log(`🌐 CORS configurado para: ${corsOrigin}`);
  console.log(`🔧 Componentes ativos:`);
  console.log(`   ├── Integração de Chamadas`);
  console.log(`   ├── Gerenciamento de Ocorrências`);
  console.log(`   ├── Geolocalização`);
  console.log(`   ├── Atendimento DHPP`);
  console.log(`   ├── Comunicação Policial`);
  console.log(`   └── Sistema de Reforços`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   ├── /api/ocorrencias (CSU01)`);
  console.log(`   ├── /api/geolocalizacao (CSU02)`);
  console.log(`   ├── /api/reforcos (Sistema de Reforços)`);
  console.log(`   ├── /api/integracao (Chamadas Externas)`);
  console.log(`   └── /api/status (Monitoramento)`);
});

// Exportar para uso em testes e simuladores
module.exports = { app, server, io };