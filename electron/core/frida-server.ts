import { promises } from "node:fs";
import path from "node:path";
import * as frida from "frida";
import { LogCallback } from "./debug-server";

export class FridaServer {
  private session: frida.Session | null = null;
  private script: frida.Script | null = null;
  private onLog: LogCallback;
  private resourcePath: string;
  private detectedVersion: number | null = null;

  constructor(resourcePath: string, onLog: LogCallback) {
    this.resourcePath = resourcePath;
    this.onLog = onLog;
  }

  getDetectedVersion(): number | null {
    return this.detectedVersion;
  }

  async start(): Promise<void> {
    const localDevice = await frida.getLocalDevice();
    const processes = await localDevice.enumerateProcesses({ scope: frida.Scope.Metadata });
    const wmpfProcesses = processes.filter((p) => p.name === "WeChatAppEx.exe");
    const wmpfPids = wmpfProcesses.map((p) => (p.parameters.ppid ? p.parameters.ppid : 0));

    const wmpfPid = wmpfPids
      .sort((a, b) => wmpfPids.filter((v) => v === a).length - wmpfPids.filter((v) => v === b).length)
      .pop();
    if (wmpfPid === undefined) {
      throw new Error("[frida] WeChatAppEx.exe process not found");
    }

    const wmpfProcess = processes.filter((p) => p.pid === wmpfPid)[0];
    const wmpfProcessPath = wmpfProcess.parameters.path as string | undefined;
    const wmpfVersionMatch = wmpfProcessPath ? wmpfProcessPath.match(/\d+/g) : "";
    const wmpfVersion = wmpfVersionMatch ? Number(wmpfVersionMatch.pop()) : 0;
    if (wmpfVersion === 0) {
      throw new Error("[frida] error in find wmpf version");
    }
    this.detectedVersion = wmpfVersion;

    this.session = await localDevice.attach(Number(wmpfPid));

    let scriptContent: string;
    try {
      scriptContent = (await promises.readFile(path.join(this.resourcePath, "frida/hook.js"))).toString();
    } catch {
      throw new Error("[frida] hook script not found");
    }

    let configContent: string;
    try {
      const raw = (await promises.readFile(path.join(this.resourcePath, "frida/config", `addresses.${wmpfVersion}.json`))).toString();
      configContent = JSON.stringify(JSON.parse(raw));
    } catch {
      throw new Error(`[frida] version config not found: ${wmpfVersion}`);
    }

    this.script = await this.session.createScript(scriptContent.replace("@@CONFIG@@", configContent));
    this.script.message.connect((message) => {
      this.onLog("info", `[frida client] ${JSON.stringify(message)}`);
    });
    await this.script.load();
    this.onLog("info", `[frida] script loaded, WMPF version: ${wmpfVersion}, pid: ${wmpfPid}`);
  }

  async stop(): Promise<void> {
    if (this.script) {
      try { await this.script.unload(); } catch { /* ignore */ }
      this.script = null;
    }
    if (this.session) {
      try { await this.session.detach(); } catch { /* ignore */ }
      this.session = null;
    }
    this.detectedVersion = null;
  }

  static getAvailableVersions(resourcePath: string): number[] {
    const fs = require("fs");
    const configDir = path.join(resourcePath, "frida/config");
    try {
      const files: string[] = fs.readdirSync(configDir);
      return files
        .filter((f: string) => f.startsWith("addresses.") && f.endsWith(".json"))
        .map((f: string) => Number(f.replace("addresses.", "").replace(".json", "")))
        .filter((v: number) => !isNaN(v))
        .sort((a: number, b: number) => b - a);
    } catch {
      return [];
    }
  }
}
