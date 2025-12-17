import React, { createContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useWebSocket } from '../hooks/useWebSocket';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Use the WebSocket hook with proper handlers
  const { isConnected, lastMessage, isMockMode } = useWebSocket(
    `ws://${window.location.hostname}:3000/ws`,
    {
      onMessage: (data) => {
        if (data.tipo === 'NOTIFICACAO') {
          handleNewNotification(data);
        }
      },
      onOpen: () => console.log('Notification WebSocket connected'),
      onClose: () => console.log('Notification WebSocket disconnected'),
      onError: (error) => console.error('Notification WebSocket error:', error),
      mockInDev: true // Enable mock mode in development
    }
  );

  // Handle new notification
  const handleNewNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    toast[notification.severity || 'info'](notification.mensagem || notification.message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }, []);

  // Effect to handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      console.log('New notification message:', lastMessage);
      // Process message if needed
    }
  }, [lastMessage]);

  // Add some mock notifications in development mode
  useEffect(() => {
    if (isMockMode) {
      // Add a mock notification after a delay
      const timer = setTimeout(() => {
        handleNewNotification({
          tipo: 'NOTIFICACAO',
          title: 'Nova ocorrência',
          mensagem: 'Uma nova ocorrência foi registrada',
          severity: 'info',
          timestamp: new Date().toISOString()
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isMockMode, handleNewNotification]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Mark a specific notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Add a new notification programmatically
  const addNotification = useCallback((notification) => {
    handleNewNotification(notification);
  }, [handleNewNotification]);

  // Context value
  const value = {
    notifications,
    unreadCount,
    isConnected,
    markAllAsRead,
    markAsRead,
    clearAll,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;