import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock user data for development
  const mockUsers = [
    {
      id: 1,
      nome: 'Admin',
      email: 'admin@siao.com',
      perfil: 'Administrador',
      orgao: 'SIAO',
      token: 'mock-token-admin'
    },
    {
      id: 2,
      nome: 'Operador Central',
      email: 'central@siao.com',
      perfil: 'Central',
      orgao: 'SIAO',
      token: 'mock-token-central'
    },
    {
      id: 3,
      nome: 'Policial PMMG',
      email: 'pmmg@siao.com',
      perfil: 'PMMG',
      orgao: 'PMMG',
      token: 'mock-token-pmmg'
    }
  ];

  // Check if token is valid
  const verifyToken = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }
      
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        const mockUser = mockUsers.find(u => u.token === token);
        if (mockUser) {
          setUser(mockUser);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        }
        setLoading(false);
        return;
      }
      
      // In production, verify with API
      const response = await api.get('/auth/verify');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error verifying token:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email, senha) => {
    try {
      setLoading(true);
      setError(null);
      
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        
        const mockUser = mockUsers.find(u => u.email === email && senha === '123456');
        if (!mockUser) {
          throw new Error('Credenciais inválidas');
        }
        
        localStorage.setItem('token', mockUser.token);
        setUser(mockUser);
        setIsAuthenticated(true);
        return mockUser;
      }
      
      // In production, use API
      const response = await api.post('/auth/login', { email, senha });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return response.data.user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Erro ao fazer login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Check token on mount
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    verifyToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;