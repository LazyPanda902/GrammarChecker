const { contextBridge, ipcRenderer } = require("electron");

function makeListener(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

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

  onGrammarStreamChunk: (callback) => makeListener("grammar:streamChunk", callback),
  onGrammarStreamDone: (callback) => makeListener("grammar:streamDone", callback),
  onGrammarStreamError: (callback) => makeListener("grammar:streamError", callback),

  onStreamChunk: (callback) => makeListener("grammar:streamChunk", callback),
  onStreamDone: (callback) => makeListener("grammar:streamDone", callback),
  onStreamError: (callback) => makeListener("grammar:streamError", callback)
});