import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/analyticsService';
import '../../styles/dev/UserTesting.css';

// Ce composant est destiné uniquement au mode développement/test
const UserTesting = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [usageReport, setUsageReport] = useState(null);
  const [showReport, setShowReport] = useState(false);
  
  // Initialiser le service d'analyse
  useEffect(() => {
    analyticsService.setEnabled(analyticsEnabled);
  }, [analyticsEnabled]);
  
  // Basculer la visibilité du panneau de test
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  // Basculer l'état du service d'analyse
  const toggleAnalytics = () => {
    setAnalyticsEnabled(!analyticsEnabled);
  };
  
  // Générer un rapport d'utilisation
  const generateReport = () => {
    const report = analyticsService.getUsageReport();
    setUsageReport(report);
    setShowReport(true);
  };
  
  // Exporter les données d'analyse
  const exportData = () => {
    const jsonData = analyticsService.exportData();
    
    // Créer un blob pour le téléchargement
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = `multitool-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Effacer les données d'analyse
  const clearData = () => {
    analyticsService.clearData();
    setUsageReport(null);
    setShowReport(false);
  };
  
  // Simuler un bug pour tester la gestion des erreurs
  const simulateError = () => {
    try {
      // Provoquer une erreur
      throw new Error('Erreur simulée pour les tests');
    } catch (error) {
      // Suivre l'erreur
      analyticsService.trackError(error, 'test_panel', false);
      
      // Afficher un message de confirmation
      alert('Erreur simulée et enregistrée!');
    }
  };
  
  if (!isVisible) {
    return (
      <button 
        className="user-testing-toggle"
        onClick={toggleVisibility}
        title="Ouvrir le panneau de test"
      >
        🧪
      </button>
    );
  }
  
  return (
    <div className="user-testing-panel">
      <div className="user-testing-header">
        <h3>Panneau de test utilisateur</h3>
        <button 
          className="close-button"
          onClick={toggleVisibility}
        >
          ×
        </button>
      </div>
      
      <div className="user-testing-content">
        <div className="testing-section">
          <h4>Suivi d'utilisation</h4>
          <div className="testing-controls">
            <label>
              <input 
                type="checkbox" 
                checked={analyticsEnabled}
                onChange={toggleAnalytics}
              />
              Activer le suivi
            </label>
            
            <div className="testing-buttons">
              <button 
                className="button button-secondary"
                onClick={generateReport}
                disabled={!analyticsEnabled}
              >
                Générer un rapport
              </button>
              <button 
                className="button button-secondary"
                onClick={exportData}
                disabled={!analyticsEnabled}
              >
                Exporter les données
              </button>
              <button 
                className="button button-secondary"
                onClick={clearData}
                disabled={!analyticsEnabled}
              >
                Effacer les données
              </button>
            </div>
          </div>
        </div>
        
        <div className="testing-section">
          <h4>Test de gestion des erreurs</h4>
          <div className="testing-controls">
            <button 
              className="button button-warning"
              onClick={simulateError}
            >
              Simuler une erreur
            </button>
          </div>
        </div>
        
        {showReport && usageReport && (
          <div className="testing-section">
            <h4>Rapport d'utilisation</h4>
            <div className="usage-report">
              <div className="report-summary">
                <div className="report-item">
                  <span className="report-label">Durée de session:</span>
                  <span className="report-value">
                    {Math.floor(usageReport.sessionDuration / 1000)} secondes
                  </span>
                </div>
                <div className="report-item">
                  <span className="report-label">Événements totaux:</span>
                  <span className="report-value">{usageReport.summary.totalEvents}</span>
                </div>
                <div className="report-item">
                  <span className="report-label">Erreurs:</span>
                  <span className="report-value">{usageReport.summary.errors}</span>
                </div>
              </div>
              
              <div className="report-details">
                <h5>Fonctionnalités utilisées</h5>
                <ul>
                  {Object.entries(usageReport.summary.featureUsage).map(([feature, count]) => (
                    <li key={feature}>
                      {feature}: {count} fois
                    </li>
                  ))}
                </ul>
                
                <h5>Écrans visités</h5>
                <ul>
                  {Object.entries(usageReport.summary.screenViews).map(([screen, count]) => (
                    <li key={screen}>
                      {screen}: {count} fois
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTesting;