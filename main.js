const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.argv.includes('--dev');

// Garder une référence globale de l'objet window pour éviter
// que la fenêtre soit fermée automatiquement quand l'objet JavaScript est garbage collected
let mainWindow;

function createWindow() {
  // Créer la fenêtre du navigateur
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // et charger le fichier index.html de l'application
  mainWindow.loadFile('index.html');

  // Ouvrir les DevTools en mode développement
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Émis lorsque la fenêtre est fermée
  mainWindow.on('closed', function () {
    // Dé-référencer l'objet window, normalement vous stockeriez les fenêtres
    // dans un tableau si votre application supporte le multi-fenêtre. C'est le moment
    // où vous devez supprimer l'élément correspondant.
    mainWindow = null;
  });
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigateur.
// Certaines APIs peuvent être utilisées uniquement après cet événement.
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    // Sur macOS il est commun de re-créer une fenêtre dans l'application quand
    // l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres ouvertes.
    if (mainWindow === null) createWindow();
  });
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Dans ce fichier, vous pouvez inclure le reste du code spécifique au processus principal de votre application
// Vous pouvez également le mettre dans des fichiers séparés et les inclure ici.

// Gestionnaire pour sélectionner un dossier
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

// Gestionnaire pour sauvegarder un fichier
ipcMain.handle('save-file', async (event, { data, defaultPath, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters
  });
  
  if (result.canceled) {
    return null;
  } else {
    fs.writeFileSync(result.filePath, Buffer.from(data));
    return result.filePath;
  }
});

// Gestionnaire pour lire les préférences
ipcMain.handle('get-preferences', () => {
  try {
    const userDataPath = app.getPath('userData');
    const prefsPath = path.join(userDataPath, 'preferences.json');
    
    if (fs.existsSync(prefsPath)) {
      const data = fs.readFileSync(prefsPath, 'utf8');
      return JSON.parse(data);
    } else {
      return {};
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des préférences:', error);
    return {};
  }
});

// Gestionnaire pour sauvegarder les préférences
ipcMain.handle('save-preferences', (event, preferences) => {
  try {
    const userDataPath = app.getPath('userData');
    const prefsPath = path.join(userDataPath, 'preferences.json');
    
    fs.writeFileSync(prefsPath, JSON.stringify(preferences, null, 2));
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences:', error);
    return false;
  }
});