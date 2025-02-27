import React, { useState, useEffect } from 'react';
import DragDropArea from '../common/DragDropArea';
import ProgressBar from '../common/ProgressBar';
import VideoProcessor from '../../utils/videoUtils';
import notificationService from '../../services/notificationService';
import '../../styles/compression/VideoCompression.css';

const VideoCompression = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [compressedVideo, setCompressedVideo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Options de compression
  const [resolution, setResolution] = useState('720p');
  const [quality, setQuality] = useState(70);
  
  // Limite Discord en octets (10 Mo)
  const DISCORD_LIMIT = 10 * 1024 * 1024;
  
  // Gérer la vidéo déposée
  const handleFileSelected = async (files) => {
    if (files.length === 0) return;
    
    // Prendre la première vidéo valide
    const videoFile = Array.from(files).find(file => VideoProcessor.isValidVideo(file));
    
    if (!videoFile) {
      notificationService.warning('Format vidéo non supporté. Formats acceptés: MP4, WebM, OGG, QuickTime');
      return;
    }
    
    try {
      setIsProcessing(true);
      setProgress(10);
      
      // Charger les informations et la miniature de la vidéo
      const info = await VideoProcessor.getVideoInfo(videoFile);
      setProgress(50);
      
      const thumbnail = await VideoProcessor.generateVideoThumbnail(videoFile);
      setProgress(100);
      
      // Mettre à jour l'état
      setVideoFile(videoFile);
      setVideoInfo(info);
      setVideoThumbnail(thumbnail);
      setCompressedVideo(null);
    } catch (error) {
      console.error('Erreur lors du chargement de la vidéo:', error);
      notificationService.error('Erreur lors du chargement de la vidéo. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };
  
  // Gérer le changement de résolution
  const handleResolutionChange = (e) => {
    setResolution(e.target.value);
  };
  
  // Gérer le changement de qualité
  const handleQualityChange = (e) => {
    setQuality(parseInt(e.target.value, 10));
  };
  
  // Compresser la vidéo
  const handleCompressVideo = async () => {
    if (!videoFile || isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Compresser la vidéo avec les options spécifiées
      const compressedBlob = await VideoProcessor.compressVideo(videoFile, {
        resolution,
        quality,
        onProgress: setProgress
      });
      
      // Mettre à jour l'état
      setCompressedVideo({
        blob: compressedBlob,
        size: compressedBlob.size,
        compressionRatio: compressedBlob.size / videoFile.size
      });
      
      // Afficher une notification de succès
      const savedSize = videoFile.size - compressedBlob.size;
      const savedPercent = ((savedSize / videoFile.size) * 100).toFixed(1);
      
      notificationService.success(
        `Vidéo compressée avec succès. Espace économisé: ${VideoProcessor.formatFileSize(savedSize)} (${savedPercent}%)`
      );
    } catch (error) {
      console.error('Erreur lors de la compression de la vidéo:', error);
      notificationService.error('Erreur lors de la compression de la vidéo. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Sauvegarder la vidéo compressée
  const handleSaveVideo = () => {
    if (!compressedVideo) return;
    
    // Obtenir le nom original et ajouter un suffixe
    const originalFileName = videoFile.name;
    const dotIndex = originalFileName.lastIndexOf('.');
    
    let newFileName;
    if (dotIndex !== -1) {
      const name = originalFileName.substring(0, dotIndex);
      const ext = originalFileName.substring(dotIndex);
      newFileName = `${name}_compressed${ext}`;
    } else {
      newFileName = `${originalFileName}_compressed`;
    }
    
    // Sauvegarder la vidéo
    VideoProcessor.saveVideo(compressedVideo.blob, newFileName);
  };
  
  // Réinitialiser tout
  const handleReset = () => {
    setVideoFile(null);
    setVideoInfo(null);
    setVideoThumbnail(null);
    setCompressedVideo(null);
  };
  
  return (
    <div className="video-compression-container">
      <h3>Compression de vidéos</h3>
      <p>Réduisez la taille de vos vidéos pour faciliter le partage</p>
      
      {!videoFile ? (
        <DragDropArea 
          onFilesSelected={handleFileSelected}
          acceptedFileTypes=".mp4,.webm,.ogg,.mov,video/*"
          multiple={false}
        >
          <p>Glissez-déposez une vidéo ici</p>
          <p>ou</p>
          <button className="button button-primary">Parcourir les fichiers</button>
          <p className="file-types-info">Formats supportés: MP4, WebM, OGG, QuickTime</p>
        </DragDropArea>
      ) : (
        <div className="video-container">
          <div className="video-preview-section">
            <div className="video-preview">
              {videoThumbnail && (
                <img 
                  src={videoThumbnail} 
                  alt="Aperçu de la vidéo" 
                  className="video-thumbnail"
                />
              )}
              {isProcessing && (
                <div className="video-processing-overlay">
                  <div className="processing-spinner"></div>
                </div>
              )}
            </div>
            
            <div className="video-info">
              <h4>{videoFile.name}</h4>
              {videoInfo && (
                <>
                  <div className="info-row">
                    <span className="info-label">Dimensions:</span>
                    <span>{videoInfo.width} x {videoInfo.height}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Durée:</span>
                    <span>{VideoProcessor.formatDuration(videoInfo.duration)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Taille originale:</span>
                    <span>{VideoProcessor.formatFileSize(videoInfo.size)}</span>
                  </div>
                  {compressedVideo && (
                    <>
                      <div className="info-row compressed">
                        <span className="info-label">Taille compressée:</span>
                        <span>{VideoProcessor.formatFileSize(compressedVideo.size)}</span>
                      </div>
                      <div className="info-row compressed">
                        <span className="info-label">Taux de compression:</span>
                        <span>{Math.round(compressedVideo.compressionRatio * 100)}%</span>
                      </div>
                    </>
                  )}
                </>
              )}
              <button 
                className="button button-text"
                onClick={handleReset}
                disabled={isProcessing}
              >
                Changer de vidéo
              </button>
            </div>
          </div>
          
          <div className="compression-options">
            <div className="options-row">
              <div className="compression-setting">
                <label htmlFor="resolution-select">Résolution:</label>
                <select 
                  id="resolution-select"
                  value={resolution} 
                  onChange={handleResolutionChange}
                  disabled={isProcessing}
                >
                  <option value="480p">480p</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>
              
              <div className="compression-setting">
                <label htmlFor="quality-slider">Qualité: {quality}%</label>
                <input 
                  id="quality-slider"
                  type="range" 
                  min="10" 
                  max="100" 
                  value={quality} 
                  onChange={handleQualityChange}
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            {/* Indicateur de limite Discord */}
            <div className="discord-limit-section">
              <div className="discord-limit-header">
                <span>Limite Discord (10 Mo)</span>
                <span>
                  {compressedVideo 
                    ? `${VideoProcessor.formatFileSize(compressedVideo.size)} / 10 MB`
                    : `${VideoProcessor.formatFileSize(videoFile.size)} / 10 MB`
                  }
                </span>
              </div>
              <div className="discord-limit-bar">
                <div 
                  className={`discord-limit-fill ${
                    (compressedVideo ? compressedVideo.size > DISCORD_LIMIT : videoFile.size > DISCORD_LIMIT) 
                    ? 'over-limit' : ''
                  }`}
                  style={{ 
                    width: `${Math.min(100, (compressedVideo 
                      ? (compressedVideo.size / DISCORD_LIMIT) * 100 
                      : (videoFile.size / DISCORD_LIMIT) * 100))}%` 
                  }}
                ></div>
                <div className="discord-limit-marker"></div>
              </div>
            </div>
          </div>
          
          {/* Barre de progression */}
          {isProcessing && (
            <div className="compression-progress">
              <p>Compression en cours...</p>
              <ProgressBar progress={progress} />
            </div>
          )}
          
          {/* Actions */}
          <div className="compression-actions">
            <button 
              className="button button-primary"
              onClick={handleCompressVideo}
              disabled={!videoFile || isProcessing}
            >
              Compresser la vidéo
            </button>
            
            {compressedVideo && (
              <button 
                className="button button-secondary"
                onClick={handleSaveVideo}
              >
                Télécharger la vidéo compressée
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCompression;