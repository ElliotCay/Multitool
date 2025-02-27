/**
 * Service d'analyse pour suivre l'utilisation de l'application
 * IMPORTANT: Dans une application réelle, il est recommandé d'obtenir le consentement 
 * de l'utilisateur avant de collecter des données d'utilisation.
 */
class AnalyticsService {
    constructor() {
      this.events = [];
      this.sessionStartTime = Date.now();
      this.isEnabled = false; // Désactivé par défaut, activé uniquement avec le consentement
    }
    
    /**
     * Active la collecte de données
     * @param {boolean} enabled - Si true, active la collecte
     */
    setEnabled(enabled) {
      this.isEnabled = Boolean(enabled);
      
      if (this.isEnabled) {
        this.trackEvent('analytics', 'enabled');
      }
    }
    
    /**
     * Suit un événement
     * @param {string} category - Catégorie de l'événement
     * @param {string} action - Action effectuée
     * @param {string} label - Étiquette (facultatif)
     * @param {number} value - Valeur numérique (facultatif)
     */
    trackEvent(category, action, label = null, value = null) {
      if (!this.isEnabled) return;
      
      const event = {
        timestamp: Date.now(),
        category,
        action,
        label,
        value
      };
      
      this.events.push(event);
      
      // Dans une application réelle, on pourrait envoyer l'événement à un service d'analyse
      console.log('Événement tracé:', event);
    }
    
    /**
     * Suit l'ouverture d'un écran
     * @param {string} screenName - Nom de l'écran
     */
    trackScreenView(screenName) {
      this.trackEvent('navigation', 'screen_view', screenName);
    }
    
    /**
     * Suit une erreur
     * @param {Error} error - L'erreur à suivre
     * @param {string} context - Contexte dans lequel l'erreur s'est produite
     * @param {boolean} isFatal - Si true, erreur fatale qui arrête l'application
     */
    trackError(error, context = '', isFatal = false) {
      this.trackEvent('error', isFatal ? 'fatal' : 'non_fatal', context, 0);
    }
    
    /**
     * Suit le temps passé dans une tâche
     * @param {string} taskName - Nom de la tâche
     * @param {number} timeMs - Temps passé en millisecondes
     */
    trackTiming(taskName, timeMs) {
      this.trackEvent('timing', taskName, null, timeMs);
    }
    
    /**
     * Suit une fonctionnalité utilisée
     * @param {string} featureName - Nom de la fonctionnalité
     * @param {Object} params - Paramètres utilisés (facultatif)
     */
    trackFeatureUse(featureName, params = {}) {
      this.trackEvent('feature', featureName, JSON.stringify(params));
    }
    
    /**
     * Obtient un rapport d'utilisation pour la session actuelle
     * @returns {Object} - Rapport d'utilisation
     */
    getUsageReport() {
      if (this.events.length === 0) {
        return {
          sessionDuration: Date.now() - this.sessionStartTime,
          events: [],
          summary: {
            totalEvents: 0,
            featureUsage: {},
            screenViews: {},
            errors: 0
          }
        };
      }
      
      // Créer un résumé des événements
      const summary = {
        totalEvents: this.events.length,
        featureUsage: {},
        screenViews: {},
        errors: 0
      };
      
      // Analyser les événements
      this.events.forEach(event => {
        // Compter les utilisations de fonctionnalités
        if (event.category === 'feature') {
          summary.featureUsage[event.action] = (summary.featureUsage[event.action] || 0) + 1;
        }
        
        // Compter les vues d'écran
        if (event.category === 'navigation' && event.action === 'screen_view') {
          summary.screenViews[event.label] = (summary.screenViews[event.label] || 0) + 1;
        }
        
        // Compter les erreurs
        if (event.category === 'error') {
          summary.errors++;
        }
      });
      
      return {
        sessionDuration: Date.now() - this.sessionStartTime,
        events: this.events,
        summary
      };
    }
    
    /**
     * Exporte les données d'utilisation au format JSON
     * @returns {string} - Données au format JSON
     */
    exportData() {
      return JSON.stringify(this.getUsageReport(), null, 2);
    }
    
    /**
     * Efface toutes les données collectées
     */
    clearData() {
      this.events = [];
      this.sessionStartTime = Date.now();
    }
  }
  
  // Créer une instance unique du service
  const analyticsService = new AnalyticsService();
  
  export default analyticsService;