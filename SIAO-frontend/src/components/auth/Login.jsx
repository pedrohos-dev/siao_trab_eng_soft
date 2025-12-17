import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const user = await login(email, senha);
      
      // Redirect based on user role
      if (user.perfil === 'Central') {
        navigate('/central');
      } else if (user.perfil === 'PMMG' || user.perfil === 'Policial') {
        navigate('/viatura');
      } else if (user.perfil === 'DHPP') {
        navigate('/dhpp');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.svg" alt="SIAO Logo" className="login-logo" />
        
          <p>Sistema Integrado de Atendimento à Ocorrências</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-login" 
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          
          <div className="login-help">
            <p>
              Para fins de demonstração, use:
              <br />
              Email: central@siao.com
              <br />
              Senha: 123456
            </p>
          </div>
        </form>
        
        <div className="login-footer">
          <p>© 2023 SIAO - Todos os direitos reservados</p>
          <p>Versão 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;