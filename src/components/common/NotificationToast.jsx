import React, { useState, useEffect } from 'react';
import '../../styles/common/NotificationToast.css';

const NotificationToast = ({ 
  message, 
  type = 'info', // 'info', 'success', 'warning', 'error'
  duration = 5000, // Durée d'affichage en ms, 0 pour ne pas auto-fermer
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      // Ajout d'un petit délai pour permettre l'animation de fermeture
      setTimeout(onClose, 300);
    }
  };

  if (!isVisible) return null;

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div className={`notification-toast ${type} ${isVisible ? 'visible' : ''}`}>
      <div className="notification-icon">{icons[type]}</div>
      <div className="notification-message">{message}</div>
      <button className="notification-close" onClick={handleClose}>×</button>
    </div>
  );
};

// Composant pour gérer plusieurs notifications
export const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationToast;