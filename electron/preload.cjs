const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  launchHub: () => ipcRenderer.invoke('launch-hub'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
