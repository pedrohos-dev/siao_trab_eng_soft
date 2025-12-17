require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'siao_secret_key',
  jwtExpire: process.env.JWT_EXPIRE || '24h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  wsEnabled: process.env.WS_ENABLED === 'true'
};