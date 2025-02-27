const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// Exposer des API protégées aux processus de rendu
contextBridge.exposeInMainWorld('electron', {
  // Fonction pour sélectionner un dossier
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // Fonction pour sauvegarder un fichier
  saveFile: (data, defaultPath, filters) => {
    return ipcRenderer.invoke('save-file', { data, defaultPath, filters });
  },
  
  // Fonctions pour les préférences
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  savePreferences: (preferences) => ipcRenderer.invoke('save-preferences', preferences)
});

// Exposer les API de système de fichiers pour la manipulation des fichiers locaux
contextBridge.exposeInMainWorld('fs', {
  // Lire un fichier
  readFile: (filePath, options) => {
    return fs.promises.readFile(filePath, options);
  },
  
  // Écrire dans un fichier
  writeFile: (filePath, data, options) => {
    return fs.promises.writeFile(filePath, data, options);
  },
  
  // Vérifier si un fichier existe
  existsSync: (filePath) => {
    return fs.existsSync(filePath);
  },
  
  // Obtenir des informations sur un fichier
  statSync: (filePath) => {
    return fs.statSync(filePath);
  },
  
  // Créer un dossier
  mkdir: (dirPath, options) => {
    return fs.promises.mkdir(dirPath, options);
  }
});

// Exposer les API de chemin
contextBridge.exposeInMainWorld('path', {
  join: (...args) => path.join(...args),
  basename: (p, ext) => path.basename(p, ext),
  dirname: (p) => path.dirname(p),
  extname: (p) => path.extname(p)
});