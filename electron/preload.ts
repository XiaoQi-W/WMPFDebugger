import { contextBridge, ipcRenderer } from "electron";

export type DebuggerAPI = {
  start: (opts: { debugPort: number; cdpPort: number }) => Promise<{ success: boolean; error?: string }>;
  stop: () => Promise<{ success: boolean; error?: string }>;
  getVersions: () => Promise<number[]>;
  getStatus: () => Promise<string>;
  onLog: (callback: (entry: any) => void) => () => void;
  onStatusChange: (callback: (status: string) => void) => () => void;
};

contextBridge.exposeInMainWorld("debuggerAPI", {
  start: (opts: { debugPort: number; cdpPort: number }) => ipcRenderer.invoke("debugger:start", opts),
  stop: () => ipcRenderer.invoke("debugger:stop"),
  getVersions: () => ipcRenderer.invoke("debugger:get-versions"),
  getStatus: () => ipcRenderer.invoke("debugger:get-status"),
  onLog: (callback: (entry: any) => void) => {
    const handler = (_event: any, entry: any) => callback(entry);
    ipcRenderer.on("debugger:log", handler);
    return () => ipcRenderer.removeListener("debugger:log", handler);
  },
  onStatusChange: (callback: (status: string) => void) => {
    const handler = (_event: any, status: string) => callback(status);
    ipcRenderer.on("debugger:status-change", handler);
    return () => ipcRenderer.removeListener("debugger:status-change", handler);
  },
} satisfies DebuggerAPI);
