import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-left">
        {toggleSidebar && (
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <span className="material-icons">MENU</span>
          </button>
        )}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <img src="/logo.svg" alt="SIAO Logo" className="navbar-logo" />
          <span className="navbar-title"></span>
        </div>
      </div>
      
      <div className="navbar-right">
        <div className="notification-container">
          <button 
            className="notification-button" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) markAllAsRead();
            }}
          >
            <span className="material-icons">Notificações</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notificações</h3>
                <button onClick={() => setShowNotifications(false)}>
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <p>Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    >
                      <div className="notification-icon">
                        <span className="material-icons">
                          {notification.icon || 'info'}
                        </span>
                      </div>
                      <div className="notification-content">
                        <p className="notification-message">{notification.mensagem || notification.message}</p>
                        <p className="notification-time">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="user-container">
          <button 
            className="user-button" 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user?.nome?.charAt(0) || 'U'}
            </div>
            <span className="user-name">{user?.nome || 'Usuário'}</span>
            <span className="material-icons"></span>
          </button>
          
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-avatar large">
                  {user?.nome?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="user-name">{user?.nome || 'Usuário'}</p>
                  <p className="user-role">{user?.perfil || 'Sem perfil'}</p>
                  <p className="user-email">{user?.email || 'sem@email.com'}</p>
                </div>
              </div>
              
              <div className="user-menu">
                <button onClick={() => navigate('/perfil')}>
                  <span className="material-icons"></span>
                  Meu Perfil
                </button>
                <button onClick={() => navigate('/configuracoes')}>
                  <span className="material-icons"></span>
                  Configurações
                </button>
                <button onClick={handleLogout}>
                  <span className="material-icons"></span>
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;