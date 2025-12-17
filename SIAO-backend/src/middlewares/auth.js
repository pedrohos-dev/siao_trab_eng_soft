const jwt = require('jsonwebtoken');
const db = require('../database/jsonDatabase');
const { jwtSecret } = require('../config/environment');

const authMiddleware = (req, res, next) => {
  try {
    // Buscar token no header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Formato: Bearer TOKEN
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }

    // Verificar token
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Token inválido' });
      }

      // Buscar usuário
      const usuario = db.findById('usuarios', decoded.id);

      if (!usuario || !usuario.ativo) {
        return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
      }

      // Adicionar usuário à requisição
      req.user = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        orgaoId: usuario.orgaoId
      };

      return next();
    });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para verificar perfis específicos
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!allowedRoles.includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Sem permissão para acessar este recurso' });
    }

    next();
  };
};

module.exports = { authMiddleware, checkRole };