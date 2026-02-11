import { EventEmitter } from "node:events";
import WebSocket, { WebSocketServer } from "ws";
import { LogCallback } from "./debug-server";

export class ProxyServer {
  private wss: WebSocketServer | null = null;
  private port: number;
  private emitter: EventEmitter;
  private onLog: LogCallback;

  constructor(port: number, emitter: EventEmitter, onLog: LogCallback) {
    this.port = port;
    this.emitter = emitter;
    this.onLog = onLog;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port: this.port }, () => {
        this.onLog("info", `[server] proxy server running on ws://localhost:${this.port}`);
        resolve();
      });
      this.wss.on("error", (err) => reject(err));

      this.wss.on("connection", (ws: WebSocket) => {
        this.onLog("info", "[conn] CDP client connected");
        ws.on("message", (message: string) => {
          this.emitter.emit("proxymessage", message);
        });
        ws.on("error", (err) => this.onLog("error", `[client] CDP err: ${err}`));
        ws.on("close", () => this.onLog("info", "[client] CDP client disconnected"));
      });

      this.emitter.on("cdpmessage", (message: string) => {
        if (!this.wss) return;
        this.wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.emitter.removeAllListeners("cdpmessage");
      if (this.wss) {
        this.wss.clients.forEach((client) => client.close());
        this.wss.close(() => {
          this.wss = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
