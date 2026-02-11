import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { DebuggerService, Status, LogEntry } from "./core/debugger-service";

let mainWindow: BrowserWindow | null = null;
let debuggerService: DebuggerService | null = null;

function getResourcePath(): string {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  // dev mode: __dirname is dist/main, project root is ../..
  return path.join(__dirname, "../..");
}

function getThirdPartyPath(): string {
  // both dev and packaged: __dirname is dist/main (or app.asar/dist/main)
  return path.join(__dirname, "../../src/third-party");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    title: "WMPF Debugger",
    backgroundColor: "#09090b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

function sendToRenderer(channel: string, data: any) {
  mainWindow?.webContents.send(channel, data);
}

function registerIpcHandlers() {
  ipcMain.handle("debugger:start", async (_event, opts: { debugPort: number; cdpPort: number }) => {
    try {
      if (debuggerService) {
        await debuggerService.stop();
      }
      debuggerService = new DebuggerService({
        debugPort: opts.debugPort,
        cdpPort: opts.cdpPort,
        resourcePath: getResourcePath(),
        thirdPartyPath: getThirdPartyPath(),
        onLog: (entry: LogEntry) => sendToRenderer("debugger:log", entry),
        onStatusChange: (status: Status) => sendToRenderer("debugger:status-change", status),
      });
      await debuggerService.start();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("debugger:stop", async () => {
    try {
      if (debuggerService) {
        await debuggerService.stop();
        debuggerService = null;
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("debugger:get-versions", () => {
    return DebuggerService.getAvailableVersions(getResourcePath());
  });

  ipcMain.handle("debugger:get-status", () => {
    return debuggerService?.getStatus() ?? "idle";
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});

app.on("window-all-closed", async () => {
  if (debuggerService) {
    await debuggerService.stop();
    debuggerService = null;
  }
  app.quit();
});
