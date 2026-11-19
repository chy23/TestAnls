const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getModelsStatus: () => ipcRenderer.invoke('get-models-status'),
  launchHub: () => ipcRenderer.invoke('launch-hub'),
  openModelDir: () => ipcRenderer.invoke('open-model-dir'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  extractFileText: (fileData) => ipcRenderer.invoke('extract-file-text', fileData)
});
