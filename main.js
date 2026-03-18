const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const {
  getSettings,
  saveApiKey,
  getApiKey,
  updateApiKeyStatus,
  clearApiKey
} = require("./electron-store");

function createWindow() {
  const win = new BrowserWindow({
    width: 1540,
    height: 1040,
    minWidth: 1180,
    minHeight: 800,
    backgroundColor: "#0A0A0F",
    autoHideMenuBar: true,
    title: "GrammarChecker",
    icon: path.join(__dirname, "frontend", "src", "assets", "grammarchecker_logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "frontend", "dist", "index.html"));
  }
}

async function validateStoredGeminiKey() {
  const apiKey = getApiKey();

  if (!apiKey) {
    updateApiKeyStatus("missing");
    return { success: false, error: "No API key saved." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Reply with exactly: OK"
    });

    updateApiKeyStatus("valid");
    return { success: true };
  } catch (error) {
    console.error("Gemini validation failed:", error);
    updateApiKeyStatus("invalid");
    return { success: false, error: "API key validation failed." };
  }
}

function buildInstruction(mode) {
  if (mode === "formal") {
    return "Rewrite the text in a formal and professional tone. Keep the meaning the same.";
  }

  if (mode === "casual") {
    return "Rewrite the text in a casual, natural, and friendly tone. Keep the meaning the same.";
  }

  if (mode === "rewrite") {
    return "Rewrite the text clearly and naturally while preserving the meaning.";
  }

  return "Correct the grammar, spelling, punctuation, and sentence structure while preserving the original meaning.";
}

ipcMain.handle("settings:get", async () => {
  return getSettings();
});

ipcMain.handle("settings:saveApiKey", async (_event, apiKey) => {
  const result = saveApiKey(apiKey);

  if (!result.success) {
    return result;
  }

  const validation = await validateStoredGeminiKey();

  return {
    success: true,
    validation
  };
});

ipcMain.handle("settings:validateApiKey", async () => {
  return validateStoredGeminiKey();
});

ipcMain.handle("settings:clearApiKey", async () => {
  return clearApiKey();
});

ipcMain.handle("grammar:check", async (_event, payload) => {
  try {
    const apiKey = getApiKey();

    if (!apiKey) {
      updateApiKeyStatus("missing");
      return {
        success: false,
        error: "No API key configured. Open Settings and add your Gemini API key."
      };
    }

    const { text, mode } = payload || {};

    if (!text || !text.trim()) {
      return {
        success: false,
        error: "Text is required."
      };
    }

    const instruction = buildInstruction(mode);
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${instruction}

Return only the improved text and no extra commentary.

Text:
${text}`
    });

    updateApiKeyStatus("valid");

    return {
      success: true,
      result: response.text || "No result returned."
    };
  } catch (error) {
    console.error("Grammar check failed:", error);
    updateApiKeyStatus("invalid");

    return {
      success: false,
      error: "Failed to process text. Check your Gemini key in Settings."
    };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("render-process-gone", (_event, _webContents, details) => {
  console.error("Renderer process gone:", details);
  dialog.showErrorBox("GrammarChecker", "The app renderer process crashed.");
});