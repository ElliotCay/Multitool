import notificationService from './notificationService';

/**
 * Service de gestion des erreurs
 */
class ErrorService {
  /**
   * Types d'erreurs
   * @type {Object}
   */
  static ErrorTypes = {
    VALIDATION_ERROR: 'validation_error',
    NETWORK_ERROR: 'network_error',
    PERMISSION_ERROR: 'permission_error',
    FILE_ERROR: 'file_error',
    UNKNOWN_ERROR: 'unknown_error'
  };

  /**
   * Gère une erreur de manière appropriée
   * @param {Error} error - L'erreur à gérer
   * @param {string} context - Contexte dans lequel l'erreur s'est produite
   * @param {boolean} showNotification - Si true, affiche une notification à l'utilisateur
   * @returns {Object} - Informations sur l'erreur
   */
  static handleError(error, context = '', showNotification = true) {
    console.error(`Erreur [${context}]:`, error);
    
    // Déterminer le type d'erreur
    const errorType = this._determineErrorType(error);
    
    // Message à afficher à l'utilisateur
    let userMessage = this._getUserFriendlyMessage(error, errorType, context);
    
    // Journaliser l'erreur (dans une application réelle, on pourrait envoyer à un service)
    this._logError(error, errorType, context);
    
    // Afficher une notification si nécessaire
    if (showNotification) {
      notificationService.error(userMessage);
    }
    
    // Retourner les informations sur l'erreur
    return {
      type: errorType,
      message: userMessage,
      originalError: error,
      context
    };
  }
  
  /**
   * Détermine le type d'erreur
   * @private
   * @param {Error} error - L'erreur à analyser
   * @returns {string} - Type d'erreur
   */
  static _determineErrorType(error) {
    const { ErrorTypes } = this;
    
    // Vérifier les erreurs de validation
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return ErrorTypes.VALIDATION_ERROR;
    }
    
    // Vérifier les erreurs réseau
    if (
      error.name === 'NetworkError' || 
      error.message.includes('network') || 
      error.message.includes('fetch') ||
      error.message.includes('connection')
    ) {
      return ErrorTypes.NETWORK_ERROR;
    }
    
    // Vérifier les erreurs de permission
    if (
      error.name === 'PermissionError' || 
      error.message.includes('permission') || 
      error.message.includes('access') ||
      error.code === 'EACCES'
    ) {
      return ErrorTypes.PERMISSION_ERROR;
    }
    
    // Vérifier les erreurs de fichier
    if (
      error.name === 'FileError' || 
      error.message.includes('file') || 
      error.message.includes('read') ||
      error.message.includes('write') ||
      error.code === 'ENOENT'
    ) {
      return ErrorTypes.FILE_ERROR;
    }
    
    // Erreur inconnue par défaut
    return ErrorTypes.UNKNOWN_ERROR;
  }
  
  /**
   * Obtient un message convivial pour l'utilisateur
   * @private
   * @param {Error} error - L'erreur d'origine
   * @param {string} errorType - Type d'erreur
   * @param {string} context - Contexte de l'erreur
   * @returns {string} - Message convivial
   */
  static _getUserFriendlyMessage(error, errorType, context) {
    const { ErrorTypes } = this;
    
    // Message de base
    let baseMessage = 'Une erreur est survenue';
    if (context) {
      baseMessage += ` lors de ${context}`;
    }
    
    // Ajouter des détails selon le type d'erreur
    switch (errorType) {
      case ErrorTypes.VALIDATION_ERROR:
        return `${baseMessage}: Les données fournies ne sont pas valides. ${error.message}`;
        
      case ErrorTypes.NETWORK_ERROR:
        return `${baseMessage}: Problème de connexion réseau. Veuillez vérifier votre connexion internet.`;
        
      case ErrorTypes.PERMISSION_ERROR:
        return `${baseMessage}: Permission refusée. Veuillez vérifier les droits d'accès.`;
        
      case ErrorTypes.FILE_ERROR:
        return `${baseMessage}: Problème avec le fichier. Le fichier pourrait être manquant, corrompu ou inaccessible.`;
        
      case ErrorTypes.UNKNOWN_ERROR:
      default:
        return `${baseMessage}. ${error.message}`;
    }
  }
  
  /**
   * Journalise l'erreur
   * @private
   * @param {Error} error - L'erreur d'origine
   * @param {string} errorType - Type d'erreur
   * @param {string} context - Contexte de l'erreur
   */
  static _logError(error, errorType, context) {
    // Dans une application réelle, on pourrait envoyer cette erreur à un service de journalisation
    // Pour l'instant, nous la journalisons simplement dans la console
    console.group('Détails de l\'erreur');
    console.error('Type:', errorType);
    console.error('Contexte:', context);
    console.error('Message:', error.message);
    console.error('Stack trace:', error.stack);
    console.groupEnd();
  }
}

export default ErrorService;