import { EventEmitter } from "node:events";
import { DebugServer, LogCallback } from "./debug-server";
import { ProxyServer } from "./proxy-server";
import { FridaServer } from "./frida-server";

export type Status = "idle" | "starting" | "running" | "error";

export interface LogEntry {
  level: "info" | "error" | "debug";
  message: string;
  timestamp: number;
}

export interface DebuggerOptions {
  debugPort: number;
  cdpPort: number;
  resourcePath: string;
  thirdPartyPath: string;
  onLog: (entry: LogEntry) => void;
  onStatusChange: (status: Status) => void;
}

export class DebuggerService {
  private debugServer: DebugServer | null = null;
  private proxyServer: ProxyServer | null = null;
  private fridaServer: FridaServer | null = null;
  private emitter = new EventEmitter();
  private status: Status = "idle";
  private options: DebuggerOptions;

  constructor(options: DebuggerOptions) {
    this.options = options;
  }

  private log: LogCallback = (level, message) => {
    this.options.onLog({ level, message, timestamp: Date.now() });
  };

  private setStatus(status: Status) {
    this.status = status;
    this.options.onStatusChange(status);
  }

  getStatus(): Status {
    return this.status;
  }

  async start(): Promise<void> {
    if (this.status === "running" || this.status === "starting") {
      throw new Error("Debugger is already running");
    }
    this.setStatus("starting");
    this.emitter = new EventEmitter();

    try {
      this.debugServer = new DebugServer(this.options.debugPort, this.emitter, this.log, this.options.thirdPartyPath);
      this.proxyServer = new ProxyServer(this.options.cdpPort, this.emitter, this.log);
      this.fridaServer = new FridaServer(this.options.resourcePath, this.log);

      await this.debugServer.start();
      await this.proxyServer.start();
      await this.fridaServer.start();

      this.setStatus("running");
      this.log("info", "[debugger] all services started successfully");
    } catch (e: any) {
      this.log("error", `[debugger] start failed: ${e.message}`);
      await this.stop();
      this.setStatus("error");
      throw e;
    }
  }

  async stop(): Promise<void> {
    this.log("info", "[debugger] stopping all services...");
    const errors: string[] = [];

    if (this.fridaServer) {
      try { await this.fridaServer.stop(); } catch (e: any) { errors.push(e.message); }
      this.fridaServer = null;
    }
    if (this.proxyServer) {
      try { await this.proxyServer.stop(); } catch (e: any) { errors.push(e.message); }
      this.proxyServer = null;
    }
    if (this.debugServer) {
      try { await this.debugServer.stop(); } catch (e: any) { errors.push(e.message); }
      this.debugServer = null;
    }

    this.emitter.removeAllListeners();
    this.setStatus("idle");
    if (errors.length > 0) {
      this.log("error", `[debugger] stop errors: ${errors.join(", ")}`);
    } else {
      this.log("info", "[debugger] all services stopped");
    }
  }

  getDetectedVersion(): number | null {
    return this.fridaServer?.getDetectedVersion() ?? null;
  }

  static getAvailableVersions(resourcePath: string): number[] {
    return FridaServer.getAvailableVersions(resourcePath);
  }
}
