const fs = require("fs");
const path = require("path");
const { app, safeStorage } = require("electron");

function getStorePath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function readStore() {
  try {
    const storePath = getStorePath();

    if (!fs.existsSync(storePath)) {
      return {};
    }

    const raw = fs.readFileSync(storePath, "utf-8");
    return JSON.parse(raw || "{}");
  } catch (error) {
    console.error("Failed to read settings store:", error);
    return {};
  }
}

function writeStore(data) {
  try {
    const storePath = getStorePath();
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write settings store:", error);
    return false;
  }
}

function getHistory() {
  const store = readStore();
  return Array.isArray(store.history) ? store.history : [];
}

function saveHistoryItem(item) {
  try {
    const store = readStore();
    const history = Array.isArray(store.history) ? store.history : [];

    const newItem = {
      id: item?.id || Date.now(),
      createdAt: item?.createdAt || new Date().toISOString(),
      mode: item?.mode || "grammar",
      originalText: item?.originalText || "",
      resultText: item?.resultText || ""
    };

    store.history = [newItem, ...history].slice(0, 50);
    writeStore(store);

    return {
      success: true,
      item: newItem
    };
  } catch (error) {
    console.error("Failed to save history item:", error);
    return {
      success: false,
      error: "Failed to save history item."
    };
  }
}

function deleteHistoryItem(id) {
  try {
    const store = readStore();
    const history = Array.isArray(store.history) ? store.history : [];
    store.history = history.filter((item) => item.id !== id);
    writeStore(store);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete history item:", error);
    return {
      success: false,
      error: "Failed to delete history item."
    };
  }
}

function clearHistory() {
  try {
    const store = readStore();
    store.history = [];
    writeStore(store);
    return { success: true };
  } catch (error) {
    console.error("Failed to clear history:", error);
    return {
      success: false,
      error: "Failed to clear history."
    };
  }
}

function getSettings() {
  const store = readStore();

  return {
    provider: store.provider || "gemini",
    model: store.model || "gemini-2.5-flash",
    hasApiKey: Boolean(store.apiKeyEncrypted || store.apiKeyPlain),
    apiKeyStatus: store.apiKeyStatus || "missing",
    lastValidatedAt: store.lastValidatedAt || null
  };
}

function saveApiKey(apiKey) {
  const trimmed = (apiKey || "").trim();

  if (!trimmed) {
    return { success: false, error: "API key is required." };
  }

  const store = readStore();

  try {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(trimmed).toString("base64");
      store.apiKeyEncrypted = encrypted;
      delete store.apiKeyPlain;
    } else {
      store.apiKeyPlain = trimmed;
      delete store.apiKeyEncrypted;
    }

    store.apiKeyStatus = "saved";
    store.lastValidatedAt = null;

    writeStore(store);

    return {
      success: true,
      encryptionAvailable: safeStorage.isEncryptionAvailable()
    };
  } catch (error) {
    console.error("Failed to save API key:", error);
    return { success: false, error: "Failed to save API key." };
  }
}

function getApiKey() {
  const store = readStore();

  try {
    if (store.apiKeyEncrypted) {
      const encryptedBuffer = Buffer.from(store.apiKeyEncrypted, "base64");

      if (!safeStorage.isEncryptionAvailable()) {
        return null;
      }

      return safeStorage.decryptString(encryptedBuffer);
    }

    if (store.apiKeyPlain) {
      return store.apiKeyPlain;
    }

    return null;
  } catch (error) {
    console.error("Failed to load API key:", error);
    return null;
  }
}

function updateApiKeyStatus(status) {
  const store = readStore();
  store.apiKeyStatus = status;
  store.lastValidatedAt = new Date().toISOString();
  writeStore(store);
}

function clearApiKey() {
  const store = readStore();
  delete store.apiKeyEncrypted;
  delete store.apiKeyPlain;
  store.apiKeyStatus = "missing";
  store.lastValidatedAt = null;
  writeStore(store);
  return { success: true };
}

module.exports = {
  getSettings,
  saveApiKey,
  getApiKey,
  updateApiKeyStatus,
  clearApiKey,
  getHistory,
  saveHistoryItem,
  deleteHistoryItem,
  clearHistory
};