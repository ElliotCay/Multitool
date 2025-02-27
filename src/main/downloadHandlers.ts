// Module pour gérer les téléchargements via yt-dlp dans le processus principal
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Types
export interface TwitterVideoInfo {
  tweetId: string;
  text: string;
  author: string;
  duration: number;
  thumbnail?: string;
}

export interface YoutubeVideoInfo {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  views?: number;
  published?: string;
}

export interface DownloadOptions {
  outputDir?: string;
  quality?: 'best' | 'high' | 'medium' | 'low';
  format?: string;
  onProgress?: (progress: number) => void;
}

export interface DownloadResult {
  filePath: string;
  fileName: string;
  size: number;
  quality: string;
  duration?: number;
  format?: string;
}

/**
 * Chemin vers l'exécutable yt-dlp
 * @returns {string} Chemin vers l'exécutable yt-dlp
 */
function getYtDlpPath(): string {
  const binDir = path.join(__dirname, '..', '..', 'bin');
  
  // Déterminer le nom de l'exécutable en fonction de la plateforme
  const execName = os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  
  return path.join(binDir, execName);
}

/**
 * Vérifie si yt-dlp est installé
 * @returns {Promise<boolean>} true si yt-dlp est installé
 */
async function checkYtDlpInstalled(): Promise<boolean> {
  const ytDlpPath = getYtDlpPath();
  
  try {
    return fs.existsSync(ytDlpPath);
  } catch (error) {
    console.error('Erreur lors de la vérification de yt-dlp:', error);
    return false;
  }
}

/**
 * Obtient des informations sur une vidéo Twitter
 * @param {string} url - URL Twitter
 * @returns {Promise<TwitterVideoInfo>} Informations sur la vidéo
 */
function getTwitterVideoInfo(url: string): Promise<TwitterVideoInfo> {
  return new Promise<TwitterVideoInfo>((resolve, reject) => {
    if (!url) {
      return reject(new Error('URL invalide'));
    }
    
    const ytDlpPath = getYtDlpPath();
    
    // Commande pour obtenir uniquement les informations
    const args = [
      '--no-warnings',
      '--print', 'id,title,uploader,duration,thumbnail',
      '--no-playlist',
      '--no-download',
      url
    ];
    
    console.log(`Exécution de: ${ytDlpPath} ${args.join(' ')}`);
    
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
        console.error(`yt-dlp a retourné un code d'erreur: ${code}`);
        console.error(`stderr: ${stderr}`);
        return reject(new Error(`Échec de l'obtention des informations. Code: ${code}, Erreur: ${stderr}`));
      }
      
      try {
        // Analyser la sortie
        const [id, title, uploader, duration, thumbnail] = stdout.trim().split('\n');
        
        resolve({
          tweetId: id || 'unknown',
          text: title || 'No title',
          author: uploader || 'Unknown user',
          duration: parseFloat(duration) || 0,
          thumbnail: thumbnail || ''
        });
      } catch (error) {
        reject(new Error(`Erreur lors de l'analyse des informations: ${(error as Error).message}`));
      }
    });
    
    process.on('error', (error: Error) => {
      reject(new Error(`Erreur lors du lancement de yt-dlp: ${error.message}`));
    });
  });
}

/**
 * Télécharge une vidéo Twitter
 * @param {string} url - URL Twitter
 * @param {DownloadOptions} options - Options de téléchargement
 * @returns {Promise<DownloadResult>} Informations sur la vidéo téléchargée
 */
function downloadTwitterVideo(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
  return new Promise<DownloadResult>((resolve, reject) => {
    if (!url) {
      return reject(new Error('URL invalide'));
    }
    
    const { 
      outputDir = path.join(os.homedir(), 'Downloads'), 
      quality = 'best',
      onProgress = () => {}
    } = options;
    
    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const ytDlpPath = getYtDlpPath();
    
    // Préparer le nom de fichier de sortie
    const outputTemplate = path.join(outputDir, 'twitter_%(id)s.%(ext)s');
    
    // Mapper la qualité aux options de yt-dlp
    const qualityOption = quality === 'best' ? 'bestvideo+bestaudio/best' :
                         quality === 'high' ? 'bestvideo[height<=720]+bestaudio/best[height<=720]' :
                         quality === 'medium' ? 'bestvideo[height<=480]+bestaudio/best[height<=480]' :
                         'worstvideo+worstaudio/worst';
    
    // Commande pour télécharger
    const args = [
      '--no-warnings',
      '-f', qualityOption,
      '-o', outputTemplate,
      '--no-playlist',
      '--write-info-json',
      url
    ];
    
    console.log(`Exécution de: ${ytDlpPath} ${args.join(' ')}`);
    
    const process = spawn(ytDlpPath, args);
    
    let stdout = '';
    let stderr = '';
    let outputFile: string | null = null;
    let progressRegex = /\[download\]\s+(\d+(?:\.\d+)?)%/;
    
    process.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      stdout += output;
      
      // Essayer d'extraire le pourcentage de progression
      const match = output.match(progressRegex);
      if (match && match[1]) {
        onProgress(parseFloat(match[1]));
      }
      
      // Essayer d'extraire le nom du fichier de sortie
      const fileMatch = output.match(/\[download\] Destination: (.+)/);
      if (fileMatch && fileMatch[1]) {
        outputFile = fileMatch[1];
      }
    });
    
    process.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    process.on('close', (code: number | null) => {
      if (code !== 0) {
        console.error(`yt-dlp a retourné un code d'erreur: ${code}`);
        console.error(`stderr: ${stderr}`);
        return reject(new Error(`Échec du téléchargement. Code: ${code}, Erreur: ${stderr}`));
      }
      
      try {
        // Si on n'a pas pu extraire le nom du fichier, on peut essayer de le déduire
        if (!outputFile) {
          const infoFiles = fs.readdirSync(outputDir).filter(f => f.includes('.info.json'));
          if (infoFiles.length > 0) {
            const infoFilePath = path.join(outputDir, infoFiles[0]);
            const infoContent = fs.readFileSync(infoFilePath, 'utf8');
            const info = JSON.parse(infoContent);
            outputFile = path.join(outputDir, `twitter_${info.id}.${info.ext}`);
          }
        }
        
        if (!outputFile) {
          return reject(new Error('Impossible de déterminer le fichier de sortie'));
        }
        
        // Obtenir les informations sur le fichier téléchargé
        const stats = fs.statSync(outputFile);
        
        resolve({
          filePath: outputFile,
          fileName: path.basename(outputFile),
          size: stats.size,
          quality: quality
        });
      } catch (error) {
        reject(new Error(`Erreur après le téléchargement: ${(error as Error).message}`));
      }
    });
    
    process.on('error', (error: Error) => {
      reject(new Error(`Erreur lors du lancement de yt-dlp: ${error.message}`));
    });
  });
}

/**
 * Extraire l'audio d'une vidéo YouTube
 * @param {string} url - URL YouTube
 * @param {DownloadOptions} options - Options d'extraction
 * @returns {Promise<DownloadResult>} Informations sur l'audio extrait
 */
function extractYouTubeAudio(url: string, options: DownloadOptions = {}): Promise<DownloadResult> {
  return new Promise<DownloadResult>((resolve, reject) => {
    if (!url) {
      return reject(new Error('URL invalide'));
    }
    
    const { 
      outputDir = path.join(os.homedir(), 'Downloads'), 
      format = 'mp3',
      quality = 'medium',
      onProgress = () => {}
    } = options;
    
    // Créer le répertoire de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const ytDlpPath = getYtDlpPath();
    
    // Préparer le nom de fichier de sortie
    const outputTemplate = path.join(outputDir, '%(title)s.%(ext)s');
    
    // Mapper la qualité aux options de yt-dlp
    const qualityOption = quality === 'best' ? '0' :
                         quality === 'high' ? '2' :
                         quality === 'medium' ? '5' :
                         '9'; // low
    
    // Commande pour extraire l'audio
    const args = [
      '--no-warnings',
      '-x',
      '--audio-format', format as string,
      '--audio-quality', qualityOption,
      '-o', outputTemplate,
      '--no-playlist',
      '--write-info-json',
      url
    ];
    
    console.log(`Exécution de: ${ytDlpPath} ${args.join(' ')}`);
    
    const process = spawn(ytDlpPath, args);
    
    let stdout = '';
    let stderr = '';
    let outputFile: string | null = null;
    let progressRegex = /\[download\]\s+(\d+(?:\.\d+)?)%/;
    
    process.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      stdout += output;
      
      // Essayer d'extraire le pourcentage de progression
      const match = output.match(progressRegex);
      if (match && match[1]) {
        onProgress(parseFloat(match[1]));
      }
      
      // Essayer d'extraire le nom du fichier de sortie
      const fileMatch = output.match(/\[download\] Destination: (.+)/);
      if (fileMatch && fileMatch[1]) {
        outputFile = fileMatch[1];
      }
    });
    
    process.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    process.on('close', (code: number | null) => {
      if (code !== 0) {
        console.error(`yt-dlp a retourné un code d'erreur: ${code}`);
        console.error(`stderr: ${stderr}`);
        return reject(new Error(`Échec de l'extraction. Code: ${code}, Erreur: ${stderr}`));
      }
      
      try {
        // Si on n'a pas pu extraire le nom du fichier, on peut essayer de le déduire
        if (!outputFile) {
          const infoFiles = fs.readdirSync(outputDir).filter(f => f.includes('.info.json'));
          if (infoFiles.length > 0) {
            const infoFilePath = path.join(outputDir, infoFiles[0]);
            const infoContent = fs.readFileSync(infoFilePath, 'utf8');
            const info = JSON.parse(infoContent);
            outputFile = path.join(outputDir, `${info.title}.${format}`);
          }
        }
        
        if (!outputFile) {
          return reject(new Error('Impossible de déterminer le fichier de sortie'));
        }
        
        // Obtenir les informations sur le fichier téléchargé
        const stats = fs.statSync(outputFile);
        
        resolve({
          filePath: outputFile,
          fileName: path.basename(outputFile),
          size: stats.size,
          format: format as string,
          quality: quality
        });
      } catch (error) {
        reject(new Error(`Erreur après l'extraction: ${(error as Error).message}`));
      }
    });
    
    process.on('error', (error: Error) => {
      reject(new Error(`Erreur lors du lancement de yt-dlp: ${error.message}`));
    });
  });
}

export {
  getYtDlpPath,
  checkYtDlpInstalled,
  getTwitterVideoInfo,
  downloadTwitterVideo,
  extractYouTubeAudio
};