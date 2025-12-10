// Preload script for Electron
// This runs in the renderer process but has access to Node.js APIs

const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Node.js functionality without exposing the entire Node.js API
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});

console.log('Fish Parasite Detection System - Desktop App Loaded');
