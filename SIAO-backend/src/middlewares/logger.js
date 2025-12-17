const winston = require('winston');
const db = require('../database/jsonDatabase');

// Configurar o logger Winston
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Middleware para logging de requisições
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user.id : 'anônimo'
    };
    
    logger.info('Requisição HTTP', logData);
    
    // Registrar logs de acesso no banco de dados para ações importantes
    if (req.method !== 'GET' && req.user) {
      db.create('logs', {
        usuarioId: req.user.id,
        acao: `${req.method}_${req.originalUrl.split('/').slice(-1)[0].toUpperCase()}`,
        descricao: `${req.method} ${req.originalUrl}`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

// Middleware para logging de erros
const errorLogger = (err, req, res, next) => {
  logger.error('Erro na aplicação', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user ? req.user.id : 'anônimo'
  });
  
  // Registrar erros no banco de dados
  if (req.user) {
    db.create('logs', {
      usuarioId: req.user.id,
      acao: 'ERRO',
      descricao: `Erro: ${err.message}`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};