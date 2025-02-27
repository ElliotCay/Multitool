// Ce service permet de gérer les notifications dans l'application
// Il pourrait être connecté à un store React (Context API, Redux, etc.)

let notificationListeners = [];
let notificationCounter = 0;

/**
 * Service de gestion des notifications
 */
const notificationService = {
  /**
   * Ajoute un écouteur pour recevoir les notifications
   * @param {Function} listener - Fonction à appeler quand une notification est créée
   * @returns {Function} - Fonction pour supprimer l'écouteur
   */
  addListener: (listener) => {
    notificationListeners.push(listener);
    return () => {
      notificationListeners = notificationListeners.filter(l => l !== listener);
    };
  },

  /**
   * Envoie une notification
   * @param {Object} notification - Objet contenant les détails de la notification
   * @param {string} notification.message - Message à afficher
   * @param {string} notification.type - Type de notification (info, success, warning, error)
   * @param {number} notification.duration - Durée d'affichage en ms (0 pour ne pas auto-fermer)
   */
  notify: ({ message, type = 'info', duration = 5000 }) => {
    const notification = {
      id: `notification-${Date.now()}-${notificationCounter++}`,
      message,
      type,
      duration,
      timestamp: new Date()
    };

    // Notifier tous les écouteurs
    notificationListeners.forEach(listener => listener(notification));
  },

  /**
   * Raccourcis pour différents types de notifications
   */
  info: (message, duration) => {
    notificationService.notify({ message, type: 'info', duration });
  },

  success: (message, duration) => {
    notificationService.notify({ message, type: 'success', duration });
  },

  warning: (message, duration) => {
    notificationService.notify({ message, type: 'warning', duration });
  },

  error: (message, duration) => {
    notificationService.notify({ message, type: 'error', duration });
  }
};

export default notificationService;