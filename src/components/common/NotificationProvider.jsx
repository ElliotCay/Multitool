import React, { useState, useEffect } from 'react';
import { NotificationContainer } from './NotificationToast';
import notificationService from '../../services/notificationService';

const NotificationProvider = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // S'abonner aux notifications
    const unsubscribe = notificationService.addListener((notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    // Nettoyer lors du démontage
    return () => unsubscribe();
  }, []);

  // Supprimer une notification
  const handleRemoveNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContainer 
      notifications={notifications} 
      onRemove={handleRemoveNotification} 
    />
  );
};

export default NotificationProvider;