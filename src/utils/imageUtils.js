// Dans une application Electron réelle, ce service utiliserait la bibliothèque native Sharp
// import sharp from 'sharp';

/**
 * Classe utilitaire pour la compression et le traitement d'images
 */
class ImageProcessor {
    /**
     * Compresse une image
     * @param {File} imageFile - Fichier image original
     * @param {Object} options - Options de compression
     * @param {number} options.quality - Qualité de compression (1-100)
     * @param {Function} options.onProgress - Fonction de rappel pour la progression
     * @returns {Promise<Blob>} - Image compressée sous forme de Blob
     */
    static async compressImage(imageFile, options = {}) {
      const { quality = 80, onProgress = () => {} } = options;
      
      // Simulation du processus de compression pour la démo
      return new Promise((resolve, reject) => {
        try {
          // Lire le fichier image
          const reader = new FileReader();
          
          reader.onload = async (event) => {
            // Dans une application réelle, vous utiliseriez Sharp ici pour compresser l'image
            // Exemple avec Sharp:
            // const buffer = Buffer.from(event.target.result);
            // const compressedBuffer = await sharp(buffer)
            //   .jpeg({ quality })
            //   .toBuffer();
            
            // Pour la démo, nous allons simuler la compression
            onProgress(30);
            
            // Créer une image pour obtenir les dimensions
            const img = new Image();
            img.onload = () => {
              // Utiliser un canvas pour simuler la compression
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Conserver les dimensions originales
              canvas.width = img.width;
              canvas.height = img.height;
              
              onProgress(60);
              
              // Dessiner l'image sur le canvas
              ctx.drawImage(img, 0, 0, img.width, img.height);
              
              // Obtenir le blob compressé avec la qualité spécifiée
              canvas.toBlob((blob) => {
                onProgress(100);
                
                // Calculer le taux de compression
                const compressionRatio = blob.size / imageFile.size;
                console.log(`Taux de compression: ${(compressionRatio * 100).toFixed(2)}%`);
                
                resolve(blob);
              }, imageFile.type, quality / 100);
            };
            
            img.src = event.target.result;
          };
          
          reader.onerror = () => {
            reject(new Error('Erreur lors de la lecture du fichier image'));
          };
          
          reader.readAsDataURL(imageFile);
        } catch (error) {
          reject(error);
        }
      });
    }
    
    /**
     * Génère une prévisualisation d'une image
     * @param {File} imageFile - Fichier image
     * @param {Object} options - Options de prévisualisation
     * @param {number} options.maxWidth - Largeur maximale de la prévisualisation
     * @param {number} options.maxHeight - Hauteur maximale de la prévisualisation
     * @returns {Promise<string>} - URL de données de la prévisualisation
     */
    static async generateImagePreview(imageFile, options = {}) {
      const { maxWidth = 300, maxHeight = 200 } = options;
      
      return new Promise((resolve, reject) => {
        try {
          const reader = new FileReader();
          
          reader.onload = (event) => {
            const img = new Image();
            
            img.onload = () => {
              // Calculer les dimensions proportionnelles
              let width = img.width;
              let height = img.height;
              
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
              
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
              
              // Créer un canvas pour la prévisualisation
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              
              // Obtenir l'URL de données
              const dataUrl = canvas.toDataURL(imageFile.type);
              resolve(dataUrl);
            };
            
            img.onerror = () => {
              reject(new Error('Erreur lors du chargement de l\'image'));
            };
            
            img.src = event.target.result;
          };
          
          reader.onerror = () => {
            reject(new Error('Erreur lors de la lecture du fichier image'));
          };
          
          reader.readAsDataURL(imageFile);
        } catch (error) {
          reject(error);
        }
      });
    }
    
    /**
     * Obtient des informations sur une image
     * @param {File} imageFile - Fichier image
     * @returns {Promise<Object>} - Informations sur l'image (dimensions, format, etc.)
     */
    static async getImageInfo(imageFile) {
      return new Promise((resolve, reject) => {
        try {
          const reader = new FileReader();
          
          reader.onload = (event) => {
            const img = new Image();
            
            img.onload = () => {
              resolve({
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height,
                format: imageFile.type.split('/')[1].toUpperCase(),
                size: imageFile.size,
                name: imageFile.name
              });
            };
            
            img.onerror = () => {
              reject(new Error('Erreur lors du chargement de l\'image'));
            };
            
            img.src = event.target.result;
          };
          
          reader.onerror = () => {
            reject(new Error('Erreur lors de la lecture du fichier image'));
          };
          
          reader.readAsDataURL(imageFile);
        } catch (error) {
          reject(error);
        }
      });
    }
    
    /**
     * Sauvegarde une image compressée
     * @param {Blob} imageBlob - Blob de l'image compressée
     * @param {string} fileName - Nom suggéré pour le fichier
     */
    static saveImage(imageBlob, fileName) {
      // Dans un environnement Electron réel, vous utiliseriez dialog.showSaveDialog
      // Pour cette démo, nous utilisons l'API FileSystem du navigateur
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      
      // Ajouter à la page, cliquer et supprimer
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
    
    /**
     * Vérifie si un fichier est une image valide
     * @param {File} file - Fichier à vérifier
     * @returns {boolean} - true si c'est une image valide
     */
    static isValidImage(file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      return validTypes.includes(file.type);
    }
    
    /**
     * Formate la taille d'un fichier en unités lisibles (KB, MB)
     * @param {number} bytes - Taille en octets
     * @param {number} decimals - Nombre de décimales
     * @returns {string} - Taille formatée
     */
    static formatFileSize(bytes, decimals = 2) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
  }
  
  export default ImageProcessor;