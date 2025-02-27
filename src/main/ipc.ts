// Configuration des canaux IPC pour les fonctionnalités de téléchargement
import { ipcMain, IpcMainInvokeEvent, dialog, shell } from 'electron';
import { 
  checkYtDlpInstalled, 
  getTwitterVideoInfo, 
  downloadTwitterVideo, 
  extractYouTubeAudio,
  TwitterVideoInfo,
  DownloadOptions,
  DownloadResult
} from './downloadHandlers';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface OutputDirs {
  pdf: string;
  images: string;
  videos: string;
  youtube: string;
  twitter: string;
}

interface DialogOptions {
  title?: string;
  defaultPath?: string;
}

/**
 * Configurer les gestionnaires d'événements IPC
 */
function setupIpcHandlers(): void {
  // Vérifier si yt-dlp est installé
  ipcMain.handle('check-ytdlp-installed', async (): Promise<boolean> => {
    return await checkYtDlpInstalled();
  });

  ipcMain.handle('show-item-in-folder', (event, filePath) => {
    if (typeof filePath === 'string') {
      shell.showItemInFolder(filePath);
      return true;
    }
    return false;
  });
  
  // Obtenir des informations sur une vidéo Twitter
  ipcMain.handle('get-twitter-video-info', async (event: IpcMainInvokeEvent, url: string): Promise<TwitterVideoInfo> => {
    try {
      return await getTwitterVideoInfo(url);
    } catch (error) {
      console.error('Erreur lors de l\'obtention des informations Twitter:', error);
      throw error;
    }
  });
  
  // Télécharger une vidéo Twitter
  ipcMain.handle('download-twitter-video', async (event: IpcMainInvokeEvent, url: string, options: DownloadOptions = {}): Promise<DownloadResult> => {
    try {
      // Utiliser le dossier de téléchargement défini ou par défaut
      const outputDir = options.outputDir || path.join(os.homedir(), 'Downloads', 'MultiTool', 'twitter');
      
      // S'assurer que le dossier existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Configurer la fonction de progression
      const progressCallback = (percent: number) => {
        event.sender.send('twitter-download-progress', percent);
      };
      
      // Lancer le téléchargement
      const downloadOptions: DownloadOptions = {
        ...options,
        outputDir,
        onProgress: progressCallback
      };
      
      const result = await downloadTwitterVideo(url, downloadOptions);
      return result;
    } catch (error) {
      console.error('Erreur lors du téléchargement de la vidéo Twitter:', error);
      throw error;
    }
  });
  
  // Obtenir des informations sur une vidéo YouTube
  ipcMain.handle('get-youtube-video-info', async (event: IpcMainInvokeEvent, url: string): Promise<any> => {
    try {
      // Utiliser yt-dlp pour obtenir les informations
      const ytDlpPath = require('./downloadHandlers').getYtDlpPath();
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const args = [
          '--no-warnings',
          '--print', 'id,title,uploader,duration',
          '--no-playlist',
          '--no-download',
          url
        ];
        
        const process = spawn(ytDlpPath, args);
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
        
        process.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
        
        process.on('close', (code: number | null) => {
          if (code !== 0) {
            return reject(new Error(`Échec de l'obtention des informations YouTube. Erreur: ${stderr}`));
          }
          
          try {
            const [id, title, uploader, duration] = stdout.trim().split('\n');
            
            resolve({
              videoId: id || 'unknown',
              title: title || 'No title',
              author: uploader || 'Unknown user',
              duration: parseFloat(duration) || 0
            });
          } catch (error) {
            reject(new Error(`Erreur lors de l'analyse des informations YouTube: ${(error as Error).message}`));
          }
        });
        
        process.on('error', (error: Error) => {
          reject(new Error(`Erreur lors du lancement de yt-dlp: ${error.message}`));
        });
      });
    } catch (error) {
      console.error('Erreur lors de l\'obtention des informations YouTube:', error);
      throw error;
    }
  });
  
  // Extraire l'audio d'une vidéo YouTube
  ipcMain.handle('extract-youtube-audio', async (event: IpcMainInvokeEvent, url: string, options: DownloadOptions = {}): Promise<DownloadResult> => {
    try {
      // Utiliser le dossier de téléchargement défini ou par défaut
      const outputDir = options.outputDir || path.join(os.homedir(), 'Downloads', 'MultiTool', 'youtube');
      
      // S'assurer que le dossier existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Configurer la fonction de progression
      const progressCallback = (percent: number) => {
        event.sender.send('youtube-extract-progress', percent);
      };
      
      // Lancer l'extraction
      const extractOptions: DownloadOptions = {
        ...options,
        outputDir,
        onProgress: progressCallback
      };
      
      const result = await extractYouTubeAudio(url, extractOptions);
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'extraction audio YouTube:', error);
      throw error;
    }
  });
  
  // Obtenir les dossiers de sortie par défaut
  ipcMain.handle('get-default-output-dirs', (): OutputDirs => {
    const baseDir = path.join(os.homedir(), 'Downloads', 'MultiTool');
    
    return {
      pdf: path.join(baseDir, 'pdf'),
      images: path.join(baseDir, 'images'),
      videos: path.join(baseDir, 'videos'),
      youtube: path.join(baseDir, 'youtube'),
      twitter: path.join(baseDir, 'twitter')
    };
  });
  
  // Sélectionner un dossier via une boîte de dialogue
  ipcMain.handle('select-directory', async (event: IpcMainInvokeEvent, options: DialogOptions = {}): Promise<string | null> => {
    const { title = 'Sélectionner un dossier', defaultPath } = options;
    
    const result = await dialog.showOpenDialog({
      title,
      defaultPath,
      properties: ['openDirectory']
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.filePaths[0];
  });
}

// Ouvrir le dossier contenant un fichier
ipcMain.handle('show-item-in-folder', async (event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du dossier:', error);
      return false;
    }
  });

export {
  setupIpcHandlers
};