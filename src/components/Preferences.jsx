import React, { useState, useEffect } from 'react';
import '../styles/Preferences.css';

// Dans une application Electron réelle, vous utiliseriez les APIs Node.js
// pour gérer les dossiers et les préférences persistantes
// Ceci est un mock pour la démonstration
const mockPreferences = {
  pdfOutputFolder: '',
  imageOutputFolder: '',
  videoOutputFolder: '',
  youtubeOutputFolder: '',
  twitterOutputFolder: ''
};

const Preferences = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState(mockPreferences);

  useEffect(() => {
    // Dans une application réelle, vous chargeriez les préférences depuis
    // un fichier de configuration ou une base de données
    // Pour le maquettage, nous utilisons les valeurs par défaut
  }, []);

  const handleChange = (key, value) => {
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  const handleSave = () => {
    // Dans une application réelle, vous sauvegarderiez les préférences
    // Pour l'instant, nous allons simplement fermer la modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="preferences-overlay">
      <div className="preferences-modal">
        <div className="preferences-header">
          <h2>Préférences</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="preferences-content">
          <div className="preference-section">
            <h3>Dossiers de sortie par défaut</h3>
            
            <div className="preference-item">
              <label>Fusion et suppression de pages PDF</label>
              <div className="folder-selector">
                <input 
                  type="text" 
                  value={preferences.pdfOutputFolder} 
                  onChange={(e) => handleChange('pdfOutputFolder', e.target.value)}
                  placeholder="Sélectionnez un dossier..."
                  readOnly 
                />
                <button className="browse-button">Parcourir...</button>
              </div>
            </div>
            
            <div className="preference-item">
              <label>Compression d'images</label>
              <div className="folder-selector">
                <input 
                  type="text" 
                  value={preferences.imageOutputFolder} 
                  onChange={(e) => handleChange('imageOutputFolder', e.target.value)}
                  placeholder="Sélectionnez un dossier..."
                  readOnly 
                />
                <button className="browse-button">Parcourir...</button>
              </div>
            </div>
            
            <div className="preference-item">
              <label>Compression de vidéos</label>
              <div className="folder-selector">
                <input 
                  type="text" 
                  value={preferences.videoOutputFolder} 
                  onChange={(e) => handleChange('videoOutputFolder', e.target.value)}
                  placeholder="Sélectionnez un dossier..."
                  readOnly 
                />
                <button className="browse-button">Parcourir...</button>
              </div>
            </div>
            
            <div className="preference-item">
              <label>Téléchargement audio YouTube</label>
              <div className="folder-selector">
                <input 
                  type="text" 
                  value={preferences.youtubeOutputFolder} 
                  onChange={(e) => handleChange('youtubeOutputFolder', e.target.value)}
                  placeholder="Sélectionnez un dossier..."
                  readOnly 
                />
                <button className="browse-button">Parcourir...</button>
              </div>
            </div>
            
            <div className="preference-item">
              <label>Téléchargement vidéos X (Twitter)</label>
              <div className="folder-selector">
                <input 
                  type="text" 
                  value={preferences.twitterOutputFolder} 
                  onChange={(e) => handleChange('twitterOutputFolder', e.target.value)}
                  placeholder="Sélectionnez un dossier..."
                  readOnly 
                />
                <button className="browse-button">Parcourir...</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="preferences-footer">
          <button className="button" onClick={onClose}>Annuler</button>
          <button className="button button-primary" onClick={handleSave}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
};

export default Preferences;