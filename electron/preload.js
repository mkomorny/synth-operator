const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanVSTs: () => ipcRenderer.invoke('scan-vsts'),
  aiVision: (args) => ipcRenderer.invoke('ai-vision', args),
  aiTips: (args) => ipcRenderer.invoke('ai-tips', args)
});
