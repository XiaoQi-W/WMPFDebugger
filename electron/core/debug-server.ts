import { EventEmitter } from "node:events";
import path from "node:path";
import WebSocket, { WebSocketServer } from "ws";

export type LogCallback = (level: "info" | "error" | "debug", message: string) => void;

export class DebugServer {
  private wss: WebSocketServer | null = null;
  private port: number;
  private emitter: EventEmitter;
  private onLog: LogCallback;
  private messageCounter = 0;
  private codex: any;
  private messageProto: any;

  constructor(port: number, emitter: EventEmitter, onLog: LogCallback, thirdPartyPath: string) {
    this.port = port;
    this.emitter = emitter;
    this.onLog = onLog;
    this.codex = require(path.join(thirdPartyPath, "RemoteDebugCodex.js"));
    this.messageProto = require(path.join(thirdPartyPath, "WARemoteDebugProtobuf.js"));
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.messageCounter = 0;
      this.wss = new WebSocketServer({ port: this.port }, () => {
        this.onLog("info", `[server] debug server running on ws://localhost:${this.port}`);
        resolve();
      });
      this.wss.on("error", (err) => reject(err));

      this.wss.on("connection", (ws: WebSocket) => {
        this.onLog("info", "[conn] miniapp client connected");
        ws.on("message", (message: ArrayBuffer) => this.onMessage(message));
        ws.on("error", (err) => this.onLog("error", `[client] err: ${err}`));
        ws.on("close", () => this.onLog("info", "[client] client disconnected"));
      });

      this.emitter.on("proxymessage", (message: string) => {
        this.broadcast(message);
      });
    });
  }

  private onMessage(message: ArrayBuffer) {
    let unwrappedData: any = null;
    try {
      const decodedData = this.messageProto.mmbizwxadevremote.WARemoteDebug_DebugMessage.decode(message);
      unwrappedData = this.codex.unwrapDebugMessageData(decodedData);
    } catch (e) {
      this.onLog("error", `[client] err: ${e}`);
    }
    if (unwrappedData === null) return;
    if (unwrappedData.category === "chromeDevtoolsResult") {
      this.emitter.emit("cdpmessage", unwrappedData.data.payload);
    }
  }

  private broadcast(message: string) {
    if (!this.wss) return;
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const rawPayload = {
          jscontext_id: "",
          op_id: Math.round(100 * Math.random()),
          payload: message.toString(),
        };
        const wrappedData = this.codex.wrapDebugMessageData(rawPayload, "chromeDevtools", 0);
        const outData = {
          seq: ++this.messageCounter,
          category: "chromeDevtools",
          data: wrappedData.buffer,
          compressAlgo: 0,
          originalSize: wrappedData.originalSize,
        };
        const encodedData = this.messageProto.mmbizwxadevremote.WARemoteDebug_DebugMessage.encode(outData).finish();
        client.send(encodedData, { binary: true });
      }
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.emitter.removeAllListeners("proxymessage");
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
