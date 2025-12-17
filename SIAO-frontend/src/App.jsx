import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Import your components
import Login from './components/auth/Login';
import MainLayout from './components/layout/MainLayout';
import CentralChamadasDashboard from './components/centralChamadas/CentralChamadasDashboard';
import RegistrarOcorrencia from './components/centralChamadas/RegistrarOcorrencia';
import ListarOcorrencias from './components/centralChamadas/ListarOcorrencias';
import OcorrenciaDetalhes from './components/centralChamadas/OcorrenciaDetalhes';
import PainelViaturaInterface from './components/painelViatura/PainelViaturaInterface';
import TestePainelViatura from './components/painelViatura/TestePainelViatura';
import RecursosProximos from './components/recursos/RecursosProximos';
import ConsultarOcorrencias from './components/consultar/ConsultarOcorrencias';
import LoadingSpinner from './components/shared/LoadingSpinner';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/central" replace />} />
              
              {/* Central de Chamadas routes */}
              <Route path="central">
                <Route index element={<CentralChamadasDashboard />} />
                <Route path="registrar" element={<RegistrarOcorrencia />} />
                <Route path="ocorrencias" element={<ListarOcorrencias />} />
                <Route path="ocorrencia/:id" element={<OcorrenciaDetalhes />} />
              </Route>
              
              {/* Recursos Próximos */}
              <Route path="recursos-proximos" element={<RecursosProximos />} />
              
              {/* Consultar Ocorrências */}
              <Route path="consultar" element={<ConsultarOcorrencias />} />
              
              {/* Add more routes as needed */}
              <Route path="relatorios" element={<div>Relatórios</div>} />
              <Route path="usuarios" element={<div>Gerenciar Usuários</div>} />
            </Route>
            
            {/* Viatura interface (fullscreen) */}
            <Route path="/viatura" element={<PainelViaturaInterface />} />
            
            {/* Viatura interface with test panel (development) */}
            <Route path="/viatura/teste" element={<TestePainelViatura />} />
            
            {/* Fallback route */}
            <Route path="*" element={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column'
              }}>
                <h1>404 - Página não encontrada</h1>
                <p>A página que você está procurando não existe.</p>
                <button 
                  onClick={() => window.history.back()}
                  style={{
                    padding: '10px 20px',
                    marginTop: '20px',
                    backgroundColor: '#1a237e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
              </div>
            } />
          </Routes>
          
          <ToastContainer position="top-right" autoClose={5000} />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;