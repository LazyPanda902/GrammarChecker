const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("grammarAPI", {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveApiKey: (apiKey) => ipcRenderer.invoke("settings:saveApiKey", apiKey),
  validateApiKey: () => ipcRenderer.invoke("settings:validateApiKey"),
  clearApiKey: () => ipcRenderer.invoke("settings:clearApiKey"),
  grammarCheck: (payload) => ipcRenderer.invoke("grammar:check", payload)
});