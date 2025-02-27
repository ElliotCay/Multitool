import React, { useState, useEffect } from 'react';
import DragDropArea from '../common/DragDropArea';
import ProgressBar from '../common/ProgressBar';
import ImageProcessor from '../../utils/imageUtils';
import notificationService from '../../services/notificationService';
import '../../styles/compression/ImageCompression.css';

const ImageCompression = () => {
  const [imageFiles, setImageFiles] = useState([]);
  const [compressedImages, setCompressedImages] = useState([]);
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  
  // Limite Discord en octets (8 Mo)
  const DISCORD_LIMIT = 8 * 1024 * 1024;
  
  // Mettre à jour les tailles totales lorsque les fichiers changent
  const totalOriginalSize = imageFiles.reduce((sum, img) => sum + img.file.size, 0);
  const totalCompressedSize = compressedImages.reduce((sum, img) => sum + img.size, 0);
  
  // Gérer les images déposées
  const handleFilesSelected = async (files) => {
    // Filtrer pour ne garder que les images valides
    const validImageFiles = Array.from(files).filter(file => 
      ImageProcessor.isValidImage(file)
    );
    
    if (validImageFiles.length === 0) {
      notificationService.warning('Aucun fichier image valide sélectionné. Formats supportés: JPEG, PNG, GIF, WebP, BMP');
      return;
    }
    
    // Traiter chaque image pour obtenir les informations et la prévisualisation
    const newImageFiles = await Promise.all(
      validImageFiles.map(async (file) => {
        try {
          const preview = await ImageProcessor.generateImagePreview(file);
          const info = await ImageProcessor.getImageInfo(file);
          
          return {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview,
            info
          };
        } catch (error) {
          console.error('Erreur lors du traitement de l\'image:', error);
          return null;
        }
      })
    );
    
    // Filtrer les erreurs et ajouter à la liste
    const validNewImages = newImageFiles.filter(Boolean);
    setImageFiles(prev => [...prev, ...validNewImages]);
  };
  
  // Supprimer une image de la liste
  const handleRemoveImage = (id) => {
    setImageFiles(prev => prev.filter(img => img.id !== id));
    setCompressedImages(prev => prev.filter(img => img.originalId !== id));
  };
  
  // Gérer le changement de qualité
  const handleQualityChange = (e) => {
    setQuality(parseInt(e.target.value, 10));
  };
  
  // Compresser toutes les images
  const handleCompressImages = async () => {
    if (imageFiles.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);
    setCurrentImageIndex(0);
    setCompressedImages([]);
    
    try {
      // Compresser chaque image une par une
      const compressed = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        setCurrentImageIndex(i);
        const imageFile = imageFiles[i];
        
        // Mettre à jour la progression globale
        const globalProgress = (i / imageFiles.length) * 100;
        setProgress(globalProgress);
        
        // Compresser l'image avec la qualité spécifiée
        const blob = await ImageProcessor.compressImage(imageFile.file, {
          quality,
          onProgress: (imageProgress) => {
            // Calculer la progression combinée (globale + image actuelle)
            const combinedProgress = globalProgress + (imageProgress / imageFiles.length);
            setProgress(combinedProgress);
          }
        });
        
        // Ajouter l'image compressée à la liste
        compressed.push({
          originalId: imageFile.id,
          blob,
          size: blob.size,
          type: blob.type,
          fileName: imageFile.file.name,
          compressionRatio: blob.size / imageFile.file.size
        });
      }
      
      setCompressedImages(compressed);
      setCurrentImageIndex(-1);
      setProgress(100);
      
      // Afficher une notification de succès
      const savedSize = totalOriginalSize - compressed.reduce((sum, img) => sum + img.size, 0);
      const savedPercent = ((savedSize / totalOriginalSize) * 100).toFixed(1);
      
      notificationService.success(
        `${imageFiles.length} image(s) compressée(s) avec succès. Espace économisé: ${ImageProcessor.formatFileSize(savedSize)} (${savedPercent}%)`
      );
    } catch (error) {
      console.error('Erreur lors de la compression des images:', error);
      notificationService.error('Erreur lors de la compression des images. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Sauvegarder une image compressée
  const handleSaveImage = (compressedImage) => {
    // Obtenir le nom original et ajouter un suffixe
    const originalFileName = compressedImage.fileName;
    const dotIndex = originalFileName.lastIndexOf('.');
    
    let newFileName;
    if (dotIndex !== -1) {
      const name = originalFileName.substring(0, dotIndex);
      const ext = originalFileName.substring(dotIndex);
      newFileName = `${name}_compressed${ext}`;
    } else {
      newFileName = `${originalFileName}_compressed`;
    }
    
    // Sauvegarder l'image
    ImageProcessor.saveImage(compressedImage.blob, newFileName);
  };
  
  // Sauvegarder toutes les images compressées
  const handleSaveAllImages = () => {
    if (compressedImages.length === 0) return;
    
    // Créer un dossier zip si plusieurs images (dans une application réelle)
    if (compressedImages.length === 1) {
      handleSaveImage(compressedImages[0]);
    } else {
      // Dans une application Electron réelle, vous pourriez utiliser JSZip
      // ou demander un dossier de destination et y enregistrer toutes les images
      notificationService.info('Sauvegarde de plusieurs images à la fois...');
      
      // Pour cette démo, nous allons simplement enregistrer les images une par une
      compressedImages.forEach(img => handleSaveImage(img));
    }
  };
  
  return (
    <div className="image-compression-container">
      <h3>Compression d'images</h3>
      <p>Réduisez la taille de vos images sans perdre trop de qualité</p>
      
      {/* Zone de glisser-déposer */}
      <DragDropArea 
        onFilesSelected={handleFilesSelected}
        acceptedFileTypes=".jpg,.jpeg,.png,.gif,.webp,.bmp,image/*"
        multiple={true}
      >
        <p>Glissez-déposez vos images ici</p>
        <p>ou</p>
        <button className="button button-primary">Parcourir les fichiers</button>
        <p className="file-types-info">Formats supportés: JPEG, PNG, GIF, WebP, BMP</p>
      </DragDropArea>
      
      {/* Liste des images sélectionnées */}
      {imageFiles.length > 0 && (
        <div className="images-list-section">
          <div className="images-list-header">
            <h4>Images sélectionnées ({imageFiles.length})</h4>
            <button 
              className="button button-text"
              onClick={() => {
                setImageFiles([]);
                setCompressedImages([]);
              }}
            >
              Tout supprimer
            </button>
          </div>
          
          <div className="images-grid">
            {imageFiles.map((image, index) => (
              <div 
                key={image.id} 
                className={`image-item ${currentImageIndex === index ? 'processing' : ''}`}
              >
                <div className="image-preview">
                  <img src={image.preview} alt={image.file.name} />
                  {currentImageIndex === index && (
                    <div className="image-processing-overlay">
                      <div className="processing-spinner"></div>
                    </div>
                  )}
                </div>
                <div className="image-details">
                  <div className="image-name">{image.file.name}</div>
                  <div className="image-info">
                    {image.info.width} x {image.info.height} • {ImageProcessor.formatFileSize(image.file.size)}
                  </div>
                  {compressedImages.find(img => img.originalId === image.id) && (
                    <div className="compression-result">
                      Compressé: {ImageProcessor.formatFileSize(compressedImages.find(img => img.originalId === image.id).size)}
                      {' '}
                      ({Math.round(compressedImages.find(img => img.originalId === image.id).compressionRatio * 100)}%)
                    </div>
                  )}
                </div>
                <button 
                  className="image-remove-button"
                  onClick={() => handleRemoveImage(image.id)}
                  disabled={isProcessing}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Options de compression */}
      {imageFiles.length > 0 && (
        <div className="compression-options">
          <div className="compression-setting">
            <label htmlFor="quality-slider">Qualité: {quality}%</label>
            <input 
              id="quality-slider"
              type="range" 
              min="5" 
              max="100" 
              value={quality} 
              onChange={handleQualityChange}
              disabled={isProcessing}
            />
            <div className="quality-labels">
              <span>Petite taille</span>
              <span>Haute qualité</span>
            </div>
          </div>
          
          {/* Indicateur de limite Discord */}
          {(totalOriginalSize > 0 || totalCompressedSize > 0) && (
            <div className="discord-limit-section">
              <div className="discord-limit-header">
                <span>Limite Discord (8 Mo)</span>
                <span>
                  {totalCompressedSize > 0 
                    ? `${ImageProcessor.formatFileSize(totalCompressedSize)} / 8 MB`
                    : `${ImageProcessor.formatFileSize(totalOriginalSize)} / 8 MB`
                  }
                </span>
              </div>
              <div className="discord-limit-bar">
                <div 
                  className={`discord-limit-fill ${totalCompressedSize > DISCORD_LIMIT || totalOriginalSize > DISCORD_LIMIT ? 'over-limit' : ''}`}
                  style={{ 
                    width: `${Math.min(100, (totalCompressedSize > 0 
                      ? (totalCompressedSize / DISCORD_LIMIT) * 100 
                      : (totalOriginalSize / DISCORD_LIMIT) * 100))}%` 
                  }}
                ></div>
                <div className="discord-limit-marker"></div>
              </div>
            </div>
          )}
        </div>
      )}
      
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
          onClick={handleCompressImages}
          disabled={imageFiles.length === 0 || isProcessing}
        >
          Compresser {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''}
        </button>
        
        {compressedImages.length > 0 && (
          <button 
            className="button button-secondary"
            onClick={handleSaveAllImages}
          >
            Télécharger {compressedImages.length > 1 ? 'toutes les images' : 'l\'image'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageCompression;