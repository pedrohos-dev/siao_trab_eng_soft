const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/jsonDatabase');
const { jwtSecret, jwtExpire } = require('../config/environment');

class AuthController {
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, senha } = req.body;

      // Buscar usuário pelo email
      const usuario = db.findOne('usuarios', { email });
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar se usuário está ativo
      if (!usuario.ativo) {
        return res.status(401).json({ error: 'Usuário inativo' });
      }

      // Verificar senha
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
        jwtSecret,
        { expiresIn: jwtExpire }
      );

      // Log de auditoria
      db.create('logs', {
        usuarioId: usuario.id,
        acao: 'LOGIN',
        descricao: `Login realizado com sucesso`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      // Retornar dados do usuário (sem senha) e token
      const { senha: _, ...usuarioSemSenha } = usuario;

      res.json({
        usuario: usuarioSemSenha,
        token
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async verificarToken(req, res) {
    try {
      // O middleware auth já verificou o token, então só precisamos retornar os dados do usuário
      const usuario = db.findById('usuarios', req.user.id);
      
      if (!usuario || !usuario.ativo) {
        return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
      }
      
      // Remover senha
      const { senha, ...usuarioSemSenha } = usuario;
      
      res.json({
        usuario: usuarioSemSenha,
        valido: true
      });
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async alterarSenha(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { senhaAtual, novaSenha } = req.body;
      
      // Buscar usuário
      const usuario = db.findById('usuarios', req.user.id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Verificar senha atual
      const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaCorreta) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }
      
      // Hash da nova senha
      const senhaHash = await bcrypt.hash(novaSenha, 10);
      
      // Atualizar senha
      db.update('usuarios', usuario.id, {
        senha: senhaHash
      });
      
      // Log de auditoria
      db.create('logs', {
        usuarioId: usuario.id,
        acao: 'ALTERAR_SENHA',
        descricao: `Senha alterada pelo próprio usuário`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async logout(req, res) {
    try {
      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'LOGOUT',
        descricao: `Logout realizado com sucesso`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      // No JWT, o logout é feito no cliente removendo o token
      // Aqui apenas registramos o log
      
      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error){
      console.error('Erro no logout:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }
}

module.exports = new AuthController();