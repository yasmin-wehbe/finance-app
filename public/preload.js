const { contextBridge, ipcRenderer } = require('electron');

// This script runs before the web page is loaded.
// It has access to both 'renderer' (HTML/JS) and 'Node.js' APIs.

contextBridge.exposeInMainWorld('electronAPI', {
  // This sends the data from React to the 'add-snapshot' listener in electron.js
  addSnapshot: (data) => ipcRenderer.invoke('add-snapshot', data),
  getSnapshots: () => ipcRenderer.invoke('get-snapshots'), // read
  deleteSnapshot: (date) => ipcRenderer.invoke('delete-snapshot', date), // delete
  readNotes: () => ipcRenderer.invoke('read-notes'), // notes
  saveNotes: (content) => ipcRenderer.invoke('save-notes', content), // notes
});