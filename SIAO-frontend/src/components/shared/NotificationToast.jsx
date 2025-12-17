import React, { useEffect } from 'react';
import './NotificationToast.css';

const NotificationToast = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <div className={`notification-toast ${type}`}>
      <div className="toast-icon">
        <i className="material-icons">{getIcon()}</i>
      </div>
      <div className="toast-content">
        {title && <h4 className="toast-title">{title}</h4>}
        {message && <p className="toast-message">{message}</p>}
      </div>
      <button className="toast-close" onClick={onClose}>
        <i className="material-icons">close</i>
      </button>
      <div 
        className="toast-progress" 
        style={{ 
          animationDuration: `${duration}ms`,
          display: duration > 0 ? 'block' : 'none'
        }}
      ></div>
    </div>
  );
};

export default NotificationToast;