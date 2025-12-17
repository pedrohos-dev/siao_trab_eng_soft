import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const Sidebar = ({ collapsed }) => {
  const { user } = useAuth();
  
  // Define menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      { to: '/consultar',  label: 'Consultar Ocorrências' }
    ];
    
    const adminItems = [
      { to: '/usuarios',  label: 'Gerenciar Usuários' },
      { to: '/relatorios', label: 'Relatórios' }
    ];
    
    const centralItems = [
      { to: '/central', label: 'Central de Chamadas' },
      { to: '/central/ocorrencias', label: 'Listar Ocorrências' },
      { to: '/central/registrar',label: 'Registrar Ocorrência' },
      { to: '/recursos-proximos', label: 'Recursos Próximos' }
    ];
    
    const pmmgItems = [
      { to: '/pmmg',  label: 'Dashboard PMMG' },
      { to: '/viatura',  label: 'Painel da Viatura' }
    ];
    
    const dhppItems = [
      { to: '/dhpp',  label: 'Dashboard DHPP' },
      { to: '/dhpp/investigacoes',  label: 'Investigações' }
    ];
    
    let items = [...commonItems];
    
    if (user?.perfil === 'Administrador') {
      items = [...items, ...adminItems, ...centralItems, ...pmmgItems, ...dhppItems];
    } else if (user?.perfil === 'Central') {
      items = [...items, ...centralItems];
    } else if (user?.perfil === 'PMMG') {
      items = [...items, ...pmmgItems];
    } else if (user?.perfil === 'DHPP') {
      items = [...items, ...dhppItems];
    }
    
    return items;
  };
  
  const menuItems = getMenuItems();
  
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <>
            <h2 className="sidebar-title">SIAO</h2>
          </>
        )}
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink 
                to={item.to} 
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <span className="material-icons">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user-info">
            <p className="user-name">{user?.nome || 'Usuário'}</p>
            <p className="user-role">{user?.perfil || 'Sem perfil'}</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;