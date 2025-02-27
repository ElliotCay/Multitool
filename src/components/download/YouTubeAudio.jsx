import React, { useState } from 'react';
import ProgressBar from '../common/ProgressBar';
import DownloadManager from '../../utils/downloadUtils';
import notificationService from '../../services/notificationService';
import '../../styles/download/YouTubeAudio.css';

const YouTubeAudio = () => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('medium');
  const [format, setFormat] = useState('mp3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloadedFile, setDownloadedFile] = useState(null);
  
  // Gérer le changement d'URL
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };
  
  // Gérer le changement de qualité
  const handleQualityChange = (e) => {
    setQuality(e.target.value);
  };
  
  // Gérer le changement de format
  const handleFormatChange = (e) => {
    setFormat(e.target.value);
  };
  
  // Vérifier si l'URL est valide
  const isValidUrl = DownloadManager.isValidYouTubeUrl(url);
  
  // Extraire l'audio de la vidéo YouTube
  const handleExtractAudio = async () => {
    if (!isValidUrl || isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);
    setVideoInfo(null);
    setDownloadedFile(null);
    
    try {
      // Appeler le service de téléchargement
      const outputDir = './downloads'; // Dans une application réelle, vous utiliseriez un dossier choisi par l'utilisateur
      
      const downloadedInfo = await DownloadManager.extractYouTubeAudio(url, {
        format,
        quality,
        outputDir,
        onProgress: setProgress,
        onInfo: (info) => {
          setVideoInfo(info);
        }
      });
      
      // Mettre à jour l'état avec les informations du fichier téléchargé
      setDownloadedFile(downloadedInfo);
      
      // Afficher une notification de succès
      notificationService.success(`L'audio a été extrait avec succès: ${downloadedInfo.fileName}`);
    } catch (error) {
      console.error('Erreur lors de l\'extraction audio:', error);
      notificationService.error(`Erreur lors de l'extraction audio: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Réinitialiser le formulaire
  const handleReset = () => {
    setUrl('');
    setVideoInfo(null);
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
            <p><strong>Titre:</strong> {downloadedFile.title}</p>
            <p><strong>Format:</strong> {downloadedFile.format.toUpperCase()}</p>
            <p><strong>Qualité:</strong> {downloadedFile.quality}</p>
            <p><strong>Taille:</strong> {DownloadManager.formatFileSize(downloadedFile.size)}</p>
            <p><strong>Fichier:</strong> {downloadedFile.fileName}</p>
          </div>
          <div className="action-buttons">
            <button 
              className="button button-primary"
              onClick={handleReset}
            >
              Extraire une autre vidéo
            </button>
          </div>
        </div>
      );
    }
    
    // Si la vidéo est en cours de traitement ou si des informations ont été récupérées
    return (
      <>
        {/* Formulaire d'extraction */}
        <div className="youtube-form">
          <div className="url-input-container">
            <input
              type="text"
              placeholder="Collez l'URL de la vidéo YouTube ici"
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
              <label htmlFor="format-select">Format audio:</label>
              <select
                id="format-select"
                value={format}
                onChange={handleFormatChange}
                disabled={isProcessing}
              >
                <option value="mp3">MP3</option>
                <option value="aac">AAC</option>
                <option value="flac">FLAC</option>
                <option value="m4a">M4A</option>
                <option value="opus">Opus</option>
                <option value="vorbis">Vorbis</option>
                <option value="wav">WAV</option>
              </select>
            </div>
            
            <div className="option-group">
              <label htmlFor="quality-select">Qualité:</label>
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
            onClick={handleExtractAudio}
            disabled={!isValidUrl || isProcessing}
          >
            {isProcessing ? 'Extraction en cours...' : 'Extraire l\'audio'}
          </button>
        </div>
        
        {/* Affichage des informations de la vidéo */}
        {(videoInfo && !downloadedFile) && (
          <div className="video-info-container">
            <h4>Informations sur la vidéo</h4>
            <div className="video-info">
              <div className="info-item">
                <span className="info-label">Titre:</span>
                <span className="info-value">{videoInfo.title}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Auteur:</span>
                <span className="info-value">{videoInfo.author}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Durée:</span>
                <span className="info-value">{DownloadManager.formatDuration(videoInfo.duration)}</span>
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
    <div className="youtube-audio-container">
      <h3>Extraction audio de YouTube</h3>
      <p>Téléchargez l'audio d'une vidéo YouTube au format de votre choix</p>
      
      {renderContent()}
    </div>
  );
};

export default YouTubeAudio;