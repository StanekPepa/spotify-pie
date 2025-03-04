const { contextBridge, ipcRenderer } = require("electron");

// Vystavení API pro renderer proces
contextBridge.exposeInMainWorld("electronAPI", {
  // Funkce pro čtení souboru
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),

  // Funkce pro zápis do souboru
  writeFile: (filePath, content) =>
    ipcRenderer.invoke("write-file", filePath, content),
});
