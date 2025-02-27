import React, { useState } from 'react';
import ProgressBar from '../common/ProgressBar';
import DownloadManager from '../../utils/downloadUtils';
import notificationService from '../../services/notificationService';
import '../../styles/download/TwitterVideo.css';

const TwitterVideo = () => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('best');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tweetInfo, setTweetInfo] = useState(null);
  const [downloadedFile, setDownloadedFile] = useState(null);
  
  // Gérer le changement d'URL
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };
  
  // Gérer le changement de qualité
  const handleQualityChange = (e) => {
    setQuality(e.target.value);
  };
  
  // Vérifier si l'URL est valide
  const isValidUrl = DownloadManager.isValidTwitterUrl(url);
  
  // Télécharger la vidéo Twitter
  const handleDownloadVideo = async () => {
    if (!isValidUrl || isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);
    setTweetInfo(null);
    setDownloadedFile(null);
    
    try {
      // Appeler le service de téléchargement
      const outputDir = './downloads'; // Dans une application réelle, vous utiliseriez un dossier choisi par l'utilisateur
      
      const downloadedInfo = await DownloadManager.downloadTwitterVideo(url, {
        quality,
        outputDir,
        onProgress: setProgress,
        onInfo: (info) => {
          setTweetInfo(info);
        }
      });
      
      // Mettre à jour l'état avec les informations du fichier téléchargé
      setDownloadedFile(downloadedInfo);
      
      // Afficher une notification de succès
      notificationService.success(`La vidéo X (Twitter) a été téléchargée avec succès: ${downloadedInfo.fileName}`);
    } catch (error) {
      console.error('Erreur lors du téléchargement de la vidéo:', error);
      notificationService.error(`Erreur lors du téléchargement de la vidéo: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Réinitialiser le formulaire
  const handleReset = () => {
    setUrl('');
    setTweetInfo(null);
    setDownloadedFile(null);
  };
  
  // Affichage conditionnel selon l'état
  const renderContent = () => {
    // Si un fichier a été téléchargé
    if (downloadedFile) {
      return (
        <div className="download-success">
          <div className="success-icon">✓</div>
          <h4>Téléchargement réussi !</h4>
          <div className="download-details">
            <p><strong>Auteur:</strong> {downloadedFile.author}</p>
            <p><strong>ID du tweet:</strong> {downloadedFile.tweetId}</p>
            <p><strong>Durée:</strong> {DownloadManager.formatDuration(downloadedFile.duration)}</p>
            <p><strong>Qualité:</strong> {downloadedFile.quality}</p>
            <p><strong>Taille:</strong> {DownloadManager.formatFileSize(downloadedFile.size)}</p>
            <p><strong>Fichier:</strong> {downloadedFile.fileName}</p>
          </div>
          <div className="action-buttons">
            <button 
              className="button button-primary"
              onClick={handleReset}
            >
              Télécharger une autre vidéo
            </button>
          </div>
        </div>
      );
    }
    
    // Si le tweet est en cours de traitement ou si des informations ont été récupérées
    return (
      <>
        {/* Formulaire de téléchargement */}
        <div className="twitter-form">
          <div className="url-input-container">
            <input
              type="text"
              placeholder="Collez l'URL du tweet contenant la vidéo"
              value={url}
              onChange={handleUrlChange}
              disabled={isProcessing}
              className={`url-input ${isValidUrl && url ? 'valid' : url ? 'invalid' : ''}`}
            />
            {url && (
              <button 
                className="clear-button"
                onClick={() => setUrl('')}
                disabled={isProcessing}
              >
                ×
              </button>
            )}
          </div>
          
          <div className="options-container">
            <div className="option-group">
              <label htmlFor="quality-select">Qualité vidéo:</label>
              <select
                id="quality-select"
                value={quality}
                onChange={handleQualityChange}
                disabled={isProcessing}
              >
                <option value="best">Meilleure</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
          </div>
          
          <button 
            className="button button-primary download-button"
            onClick={handleDownloadVideo}
            disabled={!isValidUrl || isProcessing}
          >
            {isProcessing ? 'Téléchargement en cours...' : 'Télécharger la vidéo'}
          </button>
        </div>
        
        {/* Affichage des informations du tweet */}
        {(tweetInfo && !downloadedFile) && (
          <div className="tweet-info-container">
            <h4>Informations sur le tweet</h4>
            <div className="tweet-info">
              <div className="info-item">
                <span className="info-label">Auteur:</span>
                <span className="info-value">{tweetInfo.author}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Message:</span>
                <span className="info-value tweet-text">{tweetInfo.text}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Durée:</span>
                <span className="info-value">{DownloadManager.formatDuration(tweetInfo.duration)}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Barre de progression */}
        {isProcessing && (
          <div className="progress-container">
            <p className="progress-label">
              {progress < 15 ? 'Récupération des informations...' : 
               progress < 90 ? 'Téléchargement en cours...' : 
               'Finalisation...'}
            </p>
            <ProgressBar progress={progress} />
          </div>
        )}
      </>
    );
  };
  
  return (
    <div className="twitter-video-container">
      <h3>Téléchargement de vidéos X (Twitter)</h3>
      <p>Téléchargez des vidéos depuis X (Twitter) en qualité maximale</p>
      
      {renderContent()}
    </div>
  );
};

export default TwitterVideo;