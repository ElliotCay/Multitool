import React, { useState, useEffect } from 'react';
import ProgressBar from '../common/ProgressBar';
import DownloadManager, { TwitterVideoInfo, DownloadResult } from '../../utils/downloadUtils';
import notificationService from '../../services/notificationService';
import '../../styles/download/TwitterVideo.css';

// Interface pour les props du composant
interface TwitterVideoProps {}

// Interface pour les états du composant
interface TwitterVideoState {
  url: string;
  quality: string;
  isProcessing: boolean;
  progress: number;
  tweetInfo: TwitterVideoInfo | null;
  downloadedFile: DownloadResult | null;
  outputDir: string;
  ytdlpInstalled: boolean;
  isCheckingDeps: boolean;
}

const TwitterVideo: React.FC<TwitterVideoProps> = () => {
  // État du composant
  const [url, setUrl] = useState<string>('');
  const [quality, setQuality] = useState<'best' | 'high' | 'medium' | 'low'>('best');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [tweetInfo, setTweetInfo] = useState<TwitterVideoInfo | null>(null);
  const [downloadedFile, setDownloadedFile] = useState<DownloadResult | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  const [ytdlpInstalled, setYtdlpInstalled] = useState<boolean>(false);
  const [isCheckingDeps, setIsCheckingDeps] = useState<boolean>(true);
  
  // Vérifier si yt-dlp est installé au chargement du composant
  useEffect(() => {
    const checkDependencies = async () => {
      try {
        setIsCheckingDeps(true);
        
        // Vérifier si yt-dlp est installé
        const isInstalled = await DownloadManager.checkYtDlpInstalled();
        setYtdlpInstalled(isInstalled);
        
        // Récupérer les dossiers de sortie par défaut
        const defaultDirs = await window.electron.ipcRenderer.invoke('get-default-output-dirs');
        setOutputDir(defaultDirs.twitter);
      } catch (error) {
        console.error('Erreur lors de la vérification des dépendances:', error);
        notificationService.error('Erreur lors de la vérification des dépendances. Veuillez redémarrer l\'application.');
      } finally {
        setIsCheckingDeps(false);
      }
    };
    
    checkDependencies();
  }, []);
  
  // Gérer le changement d'URL
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Pour le débogage
    if (newUrl) DownloadManager.logTwitterUrlValidation(newUrl);
  };
  
  // Gérer le changement de qualité
  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuality(e.target.value);
  };
  
  // Gérer le changement de dossier de sortie
  const handleOutputDirChange = async () => {
    try {
      const selectedDir = await window.electron.ipcRenderer.invoke('select-directory', {
        title: 'Sélectionner le dossier de téléchargement pour les vidéos Twitter',
        defaultPath: outputDir
      });
      
      if (selectedDir) {
        setOutputDir(selectedDir);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du dossier:', error);
      notificationService.error('Erreur lors de la sélection du dossier.');
    }
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
      const downloadedInfo = await DownloadManager.downloadTwitterVideo(url, {
        quality,
        outputDir,
        onProgress: setProgress,
        onInfo: (info: TwitterVideoInfo) => {
          setTweetInfo(info);
        }
      });
      
      // Mettre à jour l'état avec les informations du fichier téléchargé
      setDownloadedFile(downloadedInfo);
      
      // Afficher une notification de succès
      notificationService.success(`La vidéo X (Twitter) a été téléchargée avec succès: ${downloadedInfo.fileName}`);
    } catch (error) {
      console.error('Erreur lors du téléchargement de la vidéo:', error);
      notificationService.error(`Erreur lors du téléchargement de la vidéo: ${(error as Error).message}`);
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
  
  // Si yt-dlp n'est pas installé, afficher un message d'erreur
  if (!ytdlpInstalled && !isCheckingDeps) {
    return (
      <div className="twitter-video-container">
        <h3>Téléchargement de vidéos X (Twitter)</h3>
        <p>Téléchargez des vidéos depuis X (Twitter) en qualité maximale</p>
        
        <div className="dependency-error">
          <h4>Dépendance manquante: yt-dlp</h4>
          <p>L'outil yt-dlp est nécessaire pour télécharger des vidéos Twitter, mais il n'a pas été trouvé sur votre système.</p>
          <p>Veuillez exécuter le script d'installation des dépendances:</p>
          <div className="code-block">
            <code>npm run install-dependencies</code>
          </div>
          <p>Puis redémarrez l'application.</p>
          
          <button 
            className="button button-primary"
            onClick={() => window.location.reload()}
          >
            Rafraîchir
          </button>
        </div>
      </div>
    );
  }
  
  // Si les dépendances sont en cours de vérification, afficher un indicateur de chargement
  if (isCheckingDeps) {
    return (
      <div className="twitter-video-container">
        <h3>Téléchargement de vidéos X (Twitter)</h3>
        <p>Vérification des dépendances...</p>
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }
  
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
            <p><strong>Emplacement:</strong> {downloadedFile.filePath}</p>
          </div>
          <div className="action-buttons">
            <button 
              className="button button-secondary"
              onClick={() => {
                // Ouvrir le dossier contenant le fichier
                if (window.electron && window.electron.ipcRenderer) {
                  window.electron.ipcRenderer.invoke('show-item-in-folder', downloadedFile.filePath);
                }
              }}
            >
              Ouvrir le dossier
            </button>
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
          
          {/* Message d'aide pour les URL invalides */}
          {url && !isValidUrl && (
            <div className="url-validation-error">
              Cette URL ne semble pas être reconnue comme une URL Twitter/X valide.
              <ul>
                <li>Assurez-vous de copier l'URL complète depuis la barre d'adresse</li>
                <li>Format attendu: https://twitter.com/username/status/123456789 ou https://x.com/username/status/123456789</li>
                <li>Les liens directs vers la vidéo sont également acceptés</li>
              </ul>
            </div>
          )}
          
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
            
            <div className="option-group">
              <label htmlFor="output-dir">Dossier de téléchargement:</label>
              <div className="output-dir-selector">
                <input
                  id="output-dir"
                  type="text"
                  value={outputDir}
                  readOnly
                  disabled={isProcessing}
                />
                <button
                  className="browse-button"
                  onClick={handleOutputDirChange}
                  disabled={isProcessing}
                >
                  Parcourir...
                </button>
              </div>
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
            <ProgressBar 
              progress={progress} 
              label={progress < 15 ? 'Récupération...' : progress < 90 ? 'Téléchargement...' : 'Finalisation...'} 
            />
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