import type { DebuggerAPI } from "../../electron/preload";

declare global {
  interface Window {
    debuggerAPI: DebuggerAPI;
  }
}
