/**
 * Script pour installer les dépendances natives (ffmpeg, yt-dlp) nécessaires
 * à l'application MultiTool
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const os = require('os');

// Créer le dossier bin s'il n'existe pas
const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

// Définir les URLs de téléchargement selon la plateforme
const platform = os.platform();
const arch = os.arch();

console.log(`Détection de la plateforme: ${platform} (${arch})`);

// Configuration des URLs de téléchargement pour FFmpeg
const ffmpegUrls = {
  win32: {
    x64: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    ia32: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win32-gpl.zip'
  },
  darwin: {
    x64: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip',
    arm64: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip'
  },
  linux: {
    x64: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    ia32: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz',
    arm64: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz'
  }
};

// Configuration des URLs de téléchargement pour yt-dlp
const ytdlpUrls = {
  win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
  linux: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'
};

/**
 * Télécharge un fichier depuis une URL
 * @param {string} url - URL de téléchargement
 * @param {string} dest - Chemin de destination
 * @returns {Promise<void>}
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Téléchargement de ${url} vers ${dest}...`);
    
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Suivre la redirection
        console.log(`Redirection vers ${response.headers.location}`);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Téléchargement terminé: ${dest}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(dest);
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(dest);
      reject(err);
    });
  });
}

/**
 * Extrait un fichier zip
 * @param {string} zipPath - Chemin du fichier zip
 * @param {string} destDir - Dossier de destination
 */
function extractZip(zipPath, destDir) {
  console.log(`Extraction de ${zipPath} vers ${destDir}...`);
  
  if (platform === 'win32') {
    // Utiliser PowerShell sur Windows
    execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`, { stdio: 'inherit' });
  } else {
    // Utiliser unzip sur macOS et Linux
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: 'inherit' });
  }
  
  console.log(`Extraction terminée: ${destDir}`);
}

/**
 * Extrait un fichier tar.xz
 * @param {string} tarPath - Chemin du fichier tar.xz
 * @param {string} destDir - Dossier de destination
 */
function extractTarXz(tarPath, destDir) {
  console.log(`Extraction de ${tarPath} vers ${destDir}...`);
  
  // Utiliser tar sur macOS et Linux
  execSync(`tar -xf "${tarPath}" -C "${destDir}"`, { stdio: 'inherit' });
  
  console.log(`Extraction terminée: ${destDir}`);
}

/**
 * Rend un fichier exécutable
 * @param {string} filePath - Chemin du fichier
 */
function makeExecutable(filePath) {
  if (platform !== 'win32') {
    console.log(`Rendre exécutable: ${filePath}`);
    execSync(`chmod +x "${filePath}"`, { stdio: 'inherit' });
  }
}

/**
 * Installation de FFmpeg
 */
async function installFFmpeg() {
  console.log('Installation de FFmpeg...');
  
  try {
    // Déterminer l'URL selon la plateforme
    const ffmpegUrl = ffmpegUrls[platform]?.[arch];
    if (!ffmpegUrl) {
      console.error(`Plateforme non supportée pour FFmpeg: ${platform} ${arch}`);
      return;
    }
    
    const extension = ffmpegUrl.endsWith('zip') ? 'zip' : 'tar.xz';
    const downloadPath = path.join(binDir, `ffmpeg.${extension}`);
    const extractDir = path.join(binDir, 'ffmpeg-temp');
    
    // Créer le dossier temporaire d'extraction
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    // Télécharger FFmpeg
    await downloadFile(ffmpegUrl, downloadPath);
    
    // Extraire l'archive
    if (extension === 'zip') {
      extractZip(downloadPath, extractDir);
    } else {
      extractTarXz(downloadPath, extractDir);
    }
    
    // Trouver et copier l'exécutable FFmpeg
    let ffmpegExe;
    
    if (platform === 'win32') {
      // Sur Windows, rechercher ffmpeg.exe dans les sous-dossiers
      const findFFmpeg = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            const found = findFFmpeg(filePath);
            if (found) return found;
          } else if (file.toLowerCase() === 'ffmpeg.exe') {
            return filePath;
          }
        }
        return null;
      };
      
      ffmpegExe = findFFmpeg(extractDir);
    } else if (platform === 'darwin') {
      // Sur macOS, ffmpeg est à la racine
      ffmpegExe = path.join(extractDir, 'ffmpeg');
    } else {
      // Sur Linux, rechercher dans les sous-dossiers
      const dirs = fs.readdirSync(extractDir).filter(f => 
        fs.statSync(path.join(extractDir, f)).isDirectory()
      );
      
      if (dirs.length > 0) {
        ffmpegExe = path.join(extractDir, dirs[0], 'ffmpeg');
      }
    }
    
    if (!ffmpegExe || !fs.existsSync(ffmpegExe)) {
      console.error('Exécutable FFmpeg non trouvé dans l\'archive.');
      return;
    }
    
    // Copier l'exécutable dans le dossier bin
    const destPath = path.join(binDir, platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    fs.copyFileSync(ffmpegExe, destPath);
    
    // Rendre exécutable sur macOS et Linux
    makeExecutable(destPath);
    
    // Nettoyer
    fs.rmSync(downloadPath, { force: true });
    fs.rmSync(extractDir, { recursive: true, force: true });
    
    console.log('Installation de FFmpeg terminée!');
  } catch (error) {
    console.error('Erreur lors de l\'installation de FFmpeg:', error);
  }
}

/**
 * Installation de yt-dlp
 */
async function installYtDlp() {
  console.log('Installation de yt-dlp...');
  
  try {
    // Déterminer l'URL selon la plateforme
    const ytdlpUrl = ytdlpUrls[platform];
    if (!ytdlpUrl) {
      console.error(`Plateforme non supportée pour yt-dlp: ${platform}`);
      return;
    }
    
    // Télécharger yt-dlp
    const ytdlpPath = path.join(binDir, platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    await downloadFile(ytdlpUrl, ytdlpPath);
    
    // Rendre exécutable sur macOS et Linux
    makeExecutable(ytdlpPath);
    
    console.log('Installation de yt-dlp terminée!');
  } catch (error) {
    console.error('Erreur lors de l\'installation de yt-dlp:', error);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('Début de l\'installation des dépendances...');
  
  try {
    // Installer FFmpeg
    await installFFmpeg();
    
    // Installer yt-dlp
    await installYtDlp();
    
    console.log('Installation des dépendances terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'installation des dépendances:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();