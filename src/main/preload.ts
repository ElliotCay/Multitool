import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Mettre à jour la liste des canaux pour inclure tous vos canaux d'événements
export type Channels = 'ipc-example' | 'twitter-download-progress' | 'youtube-extract-progress' | 'show-item-in-folder';

// Liste des canaux IPC autorisés pour les invocations
const validInvokeChannels = [
  'is-dev',
  'check-ytdlp-installed',
  'get-twitter-video-info',
  'download-twitter-video',
  'get-youtube-video-info',
  'extract-youtube-audio',
  'get-default-output-dirs',
  'select-directory',
  'show-item-in-folder'
];

// Liste des canaux IPC autorisés pour les événements
const validOnChannels = [
  'ipc-example',
  'twitter-download-progress',
  'youtube-extract-progress'
];

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    
    on(channel: Channels, func: (...args: unknown[]) => void) {
      if (!validOnChannels.includes(channel)) {
        throw new Error(`Canal IPC non autorisé: ${channel}`);
      }
      
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    
    once(channel: Channels, func: (...args: unknown[]) => void) {
      if (!validOnChannels.includes(channel)) {
        throw new Error(`Canal IPC non autorisé: ${channel}`);
      }
      
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    
    // Ajouter cette méthode invoke
    async invoke(channel: string, ...args: unknown[]) {
      if (!validInvokeChannels.includes(channel)) {
        throw new Error(`Canal IPC invoke non autorisé: ${channel}`);
      }
      
      return await ipcRenderer.invoke(channel, ...args);
    }
  },
  
  // Autres gestionnaires si nécessaire
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;