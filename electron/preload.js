// Preload script for security
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onFlaskPort: (callback) => ipcRenderer.on('flask-port', callback),
});

