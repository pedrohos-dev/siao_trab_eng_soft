const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../database/jsonDatabase');

class UsuarioController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nome, email, senha, perfil, orgaoId } = req.body;

      // Verificar se já existe usuário com mesmo email
      const usuarioExistente = db.findOne('usuarios', { email });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Já existe um usuário com este email' });
      }

      // Verificar se o órgão existe (se informado)
      if (orgaoId) {
        const orgao = db.findById('orgaos', orgaoId);
        if (!orgao) {
          return res.status(400).json({ error: 'Órgão não encontrado' });
        }
      }

      // Hash da senha
      const senhaHash = bcrypt.hashSync(senha, 10);

      const usuario = db.create('usuarios', {
        nome,
        email,
        senha: senhaHash,
        perfil,
        ativo: true,
        orgaoId: orgaoId || null
      });

      // Remover senha do retorno
      const { senha: _, ...usuarioSemSenha } = usuario;

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'CRIAR_USUARIO',
        descricao: `Usuário ${email} criado com perfil ${perfil}`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      res.status(201).json(usuarioSemSenha);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async list(req, res) {
    try {
      const { perfil, ativo, orgaoId } = req.query;
      
      let usuarios = db.findAll('usuarios');
      
      // Aplicar filtros
      if (perfil) {
        usuarios = usuarios.filter(u => u.perfil === perfil);
      }
      
      if (ativo !== undefined) {
        const isAtivo = ativo === 'true';
        usuarios = usuarios.filter(u => u.ativo === isAtivo);
      }
      
      if (orgaoId) {
        usuarios = usuarios.filter(u => u.orgaoId === orgaoId);
      }
      
      // Remover senhas
      const usuariosSemSenha = usuarios.map(u => {
        const { senha, ...usuarioSemSenha } = u;
        return usuarioSemSenha;
      });
      
      // Enriquecer com dados do órgão
      const usuariosComOrgao = await Promise.all(usuariosSemSenha.map(async u => {
        if (u.orgaoId) {
          const orgao = db.findById('orgaos', u.orgaoId);
          return {
            ...u,
            orgao: orgao ? { nome: orgao.nome, sigla: orgao.sigla } : null
          };
        }
        return u;
      }));
      
      res.json(usuariosComOrgao);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const usuario = db.findById('usuarios', id);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Remover senha
      const { senha, ...usuarioSemSenha } = usuario;

      // Buscar dados do órgão
      if (usuario.orgaoId) {
        const orgao = db.findById('orgaos', usuario.orgaoId);
        if (orgao) {
          usuarioSemSenha.orgao = {
            nome: orgao.nome,
            sigla: orgao.sigla
          };
        }
      }

      res.json(usuarioSemSenha);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Verificar se usuário existe
      const usuario = db.findById('usuarios', id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Não permitir alteração de email para um já existente
      if (updates.email && updates.email !== usuario.email) {
        const usuarioExistente = db.findOne('usuarios', { email: updates.email });
        if (usuarioExistente) {
          return res.status(400).json({ error: 'Já existe um usuário com este email' });
        }
      }

      // Verificar se o órgão existe (se informado)
      if (updates.orgaoId) {
        const orgao = db.findById('orgaos', updates.orgaoId);
        if (!orgao) {
          return res.status(400).json({ error: 'Órgão não encontrado' });
        }
      }

      // Se estiver atualizando a senha, fazer hash
      if (updates.senha) {
        updates.senha = bcrypt.hashSync(updates.senha, 10);
      }

      const usuarioAtualizado = db.update('usuarios', id, updates);

      // Remover senha do retorno
      const { senha, ...usuarioSemSenha } = usuarioAtualizado;

      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'ATUALIZAR_USUARIO',
        descricao: `Usuário ${usuarioAtualizado.email} atualizado`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      res.json(usuarioSemSenha);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async toggleAtivo(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se usuário existe
      const usuario = db.findById('usuarios', id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Não permitir desativar o próprio usuário
      if (id === req.user.id) {
        return res.status(400).json({ error: 'Não é possível desativar seu próprio usuário' });
      }
      
      const usuarioAtualizado = db.update('usuarios', id, {
        ativo: !usuario.ativo
      });
      
      // Remover senha do retorno
      const { senha, ...usuarioSemSenha } = usuarioAtualizado;
      
      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: usuarioAtualizado.ativo ? 'ATIVAR_USUARIO' : 'DESATIVAR_USUARIO',
        descricao: `Usuário ${usuarioAtualizado.email} ${usuarioAtualizado.ativo ? 'ativado' : 'desativado'}`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      res.json(usuarioSemSenha);
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }

  async resetarSenha(req, res) {
    try {
      const { id } = req.params;
      const { novaSenha } = req.body;
      
      if (!novaSenha || novaSenha.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
      }
      
      // Verificar se usuário existe
      const usuario = db.findById('usuarios', id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Hash da nova senha
      const senhaHash = bcrypt.hashSync(novaSenha, 10);
      
      const usuarioAtualizado = db.update('usuarios', id, {
        senha: senhaHash
      });
      
      // Log de auditoria
      db.create('logs', {
        usuarioId: req.user.id,
        acao: 'RESETAR_SENHA',
        descricao: `Senha do usuário ${usuario.email} resetada`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      res.json({ message: 'Senha resetada com sucesso' });
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
    }
  }
}

module.exports = new UsuarioController();