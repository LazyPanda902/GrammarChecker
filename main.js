const { app, BrowserWindow } = require("electron");
const path = require("path");

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
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});