/**
 * Classe utilitaire pour le téléchargement de contenu en ligne
 * Cette classe utilise l'API IPC pour communiquer avec le processus principal
 * qui gère les téléchargements via yt-dlp
 */

// Interface pour les propriétés de la fenêtre Electron
declare global {
    interface Window {
      electron: {
        ipcRenderer: {
          invoke: (channel: string, ...args: any[]) => Promise<any>;
          on: (channel: string, callback: (...args: any[]) => void) => () => void;
          sendMessage: (channel: string, ...args: any[]) => void;
        };
      };
    }
  }
  
  // Types pour les fonctions de téléchargement
  export interface DownloadOptions {
    format?: string;
    quality?: 'best' | 'high' | 'medium' | 'low';
    outputDir?: string;
    onProgress?: (progress: number) => void;
    onInfo?: (info: any) => void;
  }
  
  export interface TwitterVideoInfo {
    tweetId: string;
    author: string;
    text: string;
    duration: number;
  }
  
  export interface YoutubeVideoInfo {
    videoId: string;
    title: string;
    author: string;
    duration: number;
  }
  
  export interface DownloadResult {
    filePath: string;
    fileName: string;
    size: number;
    quality: string;
    author: string;
    tweetId?: string;
    text?: string;
    title?: string;
    format?: string;
    duration: number;
  }
  
  class DownloadManager {
      /**
       * Vérifie si yt-dlp est installé
       * @returns {Promise<boolean>} true si yt-dlp est installé
       */
      static async checkYtDlpInstalled(): Promise<boolean> {
        try {
          return await window.electron.ipcRenderer.invoke('check-ytdlp-installed');
        } catch (error) {
          console.error('Erreur lors de la vérification de yt-dlp:', error);
          return false;
        }
      }
      
      /**
       * Extrait l'audio d'une vidéo YouTube
       * @param {string} url - URL de la vidéo YouTube
       * @param {DownloadOptions} options - Options de téléchargement
       * @returns {Promise<DownloadResult>} - Informations sur le fichier téléchargé
       */
      static async extractYouTubeAudio(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
        const { 
          format = 'mp3', 
          quality = 'medium', 
          outputDir, 
          onProgress = () => {}, 
          onInfo = () => {} 
        } = options;
        
        // Vérifier que l'URL est valide
        if (!this.isValidYouTubeUrl(url)) {
          throw new Error('URL YouTube invalide');
        }
        
        try {
          // Obtenir d'abord les informations sur la vidéo
          const videoInfo = await window.electron.ipcRenderer.invoke('get-youtube-video-info', url);
          onInfo(videoInfo);
          
          // S'abonner aux mises à jour de progression
          const progressUnsubscribe = window.electron.ipcRenderer.on(
            'youtube-extract-progress',
            (progress: number) => {
              onProgress(progress);
            }
          );
          
          // Extraire l'audio
          const result = await window.electron.ipcRenderer.invoke('extract-youtube-audio', url, {
            format,
            quality,
            outputDir
          });
          
          // Annuler l'abonnement aux mises à jour de progression
          progressUnsubscribe();
          
          // Ajouter les informations supplémentaires au résultat
          return {
            ...result,
            title: videoInfo.title,
            author: videoInfo.author,
            duration: videoInfo.duration
          };
        } catch (error) {
          console.error('Erreur lors de l\'extraction audio:', error);
          throw error;
        }
      }
      
      /**
       * Télécharge une vidéo depuis X (Twitter)
       * @param {string} url - URL du tweet avec vidéo
       * @param {DownloadOptions} options - Options de téléchargement
       * @returns {Promise<DownloadResult>} - Informations sur le fichier téléchargé
       */
      static async downloadTwitterVideo(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
        const { 
          quality = 'best', 
          outputDir, 
          onProgress = () => {}, 
          onInfo = () => {} 
        } = options;
        
        // Vérifier que l'URL est valide
        if (!this.isValidTwitterUrl(url)) {
          throw new Error('URL Twitter (X) invalide');
        }
        
        try {
          // Obtenir d'abord les informations sur le tweet
          const tweetInfo = await window.electron.ipcRenderer.invoke('get-twitter-video-info', url);
          onInfo(tweetInfo);
          
          // S'abonner aux mises à jour de progression
          const progressUnsubscribe = window.electron.ipcRenderer.on(
            'twitter-download-progress',
            (progress: number) => {
              onProgress(progress);
            }
          );
          
          // Télécharger la vidéo
          const result = await window.electron.ipcRenderer.invoke('download-twitter-video', url, {
            quality,
            outputDir
          });
          
          // Annuler l'abonnement aux mises à jour de progression
          progressUnsubscribe();
          
          // Ajouter les informations supplémentaires au résultat
          return {
            ...result,
            author: tweetInfo.author,
            tweetId: tweetInfo.tweetId,
            text: tweetInfo.text,
            duration: tweetInfo.duration
          };
        } catch (error) {
          console.error('Erreur lors du téléchargement de la vidéo:', error);
          throw error;
        }
      }
      
      /**
       * Vérifie si une URL est une URL YouTube valide
       * @param {string} url - URL à vérifier
       * @returns {boolean} - true si c'est une URL YouTube valide
       */
      static isValidYouTubeUrl(url: string): boolean {
        if (!url) return false;
        
        // Expressions régulières pour les différents formats d'URL YouTube
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        return youtubeRegex.test(url);
      }
      
      /**
       * Vérifie si une URL est une URL Twitter (X) valide
       * @param {string} url - URL à vérifier
       * @returns {boolean} - true si c'est une URL Twitter valide
       */
      static isValidTwitterUrl(url: string): boolean {
        if (!url) return false;
        
        // Expressions régulières pour les différents formats d'URL Twitter (X)
        const twitterRegexPatterns = [
          // Format standard de tweet
          /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/,
          
          // URL directe de la vidéo
          /^(https?:\/\/)?(video\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/videos?\/\d+/,
          
          // URL mobile
          /^(https?:\/\/)?(mobile\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/,
          
          // URL avec paramètres supplémentaires
          /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+\?.+/,
          
          // URL de vidéo avec paramètres (format parfois rencontré)
          /^(https?:\/\/)?[a-zA-Z0-9_.-]+\.(twimg\.com)(\/[a-zA-Z0-9_\/-]+)?\/(vid|video)\/\d+/,
          
          // Format d'URL court
          /^(https?:\/\/)?(t\.co)\/[a-zA-Z0-9_]+$/
        ];
        
        // Tester l'URL contre chaque pattern
        return twitterRegexPatterns.some(regex => regex.test(url));
      }
      
      /**
       * Extrait l'ID d'une vidéo YouTube à partir de son URL
       * @param {string} url - URL YouTube
       * @returns {string|null} - ID de la vidéo ou null si non trouvé
       */
      static extractYouTubeVideoId(url: string): string | null {
        if (!url) return null;
        
        // Essayer de trouver l'ID dans différents formats d'URL
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
      }
      
      /**
       * Extrait l'ID d'un tweet à partir de son URL
       * @param {string} url - URL Twitter
       * @returns {string|null} - ID du tweet ou null si non trouvé
       */
      static extractTwitterTweetId(url: string): string | null {
        if (!url) return null;
        
        // Essayer de trouver l'ID dans différents formats d'URL
        const regExp = /\/status\/(\d+)/;
        const match = url.match(regExp);
        
        return match ? match[1] : null;
      }
      
      /**
       * Formate la durée en heures, minutes, secondes
       * @param {number} seconds - Durée en secondes
       * @returns {string} - Durée formatée
       */
      static formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
          return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
      }
      
      /**
       * Formate la taille d'un fichier en unités lisibles (KB, MB)
       * @param {number} bytes - Taille en octets
       * @param {number} decimals - Nombre de décimales
       * @returns {string} - Taille formatée
       */
      static formatFileSize(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
      }
      
      /**
       * Pour le débogage: Affiche dans la console les informations de validation d'URL Twitter
       * @param {string} url - URL à valider
       */
      static logTwitterUrlValidation(url: string): void {
        console.log(`Validation d'URL Twitter: ${url}`);
        console.log(`URL valide: ${this.isValidTwitterUrl(url)}`);
        
        if (!this.isValidTwitterUrl(url)) {
          console.log('Essayez de copier l\'URL directement depuis la barre d\'adresse du navigateur.');
        }
      }
    }
    
    export default DownloadManager;