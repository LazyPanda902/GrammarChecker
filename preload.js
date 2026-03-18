const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("grammarAPI", {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveApiKey: (apiKey) => ipcRenderer.invoke("settings:saveApiKey", apiKey),
  validateApiKey: () => ipcRenderer.invoke("settings:validateApiKey"),
  clearApiKey: () => ipcRenderer.invoke("settings:clearApiKey"),
  grammarCheck: (payload) => ipcRenderer.invoke("grammar:check", payload),

  getHistory: () => ipcRenderer.invoke("history:get"),
  saveHistory: (item) => ipcRenderer.invoke("history:save", item),
  deleteHistory: (id) => ipcRenderer.invoke("history:delete", id),
  clearHistory: () => ipcRenderer.invoke("history:clear"),

  startGrammarStream: (payload) => ipcRenderer.invoke("grammar:streamStart", payload),

  onGrammarStreamChunk: (callback) => {
    const listener = (_event, chunk) => callback(chunk);
    ipcRenderer.on("grammar:streamChunk", listener);
    return () => ipcRenderer.removeListener("grammar:streamChunk", listener);
  },

  onGrammarStreamDone: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("grammar:streamDone", listener);
    return () => ipcRenderer.removeListener("grammar:streamDone", listener);
  },

  onGrammarStreamError: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("grammar:streamError", listener);
    return () => ipcRenderer.removeListener("grammar:streamError", listener);
  }
});