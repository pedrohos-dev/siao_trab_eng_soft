const errorHandler = (err, req, res, next) => {
  console.error('Erro capturado pelo middleware:', err);

  // Verificar se é um erro conhecido
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.details || err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Não autorizado',
      details: err.message
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Acesso negado',
      details: err.message
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Recurso não encontrado',
      details: err.message
    });
  }

  // Erro interno do servidor (padrão)
  return res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ocorreu um erro inesperado' 
      : err.message
  });
};

module.exports = errorHandler;