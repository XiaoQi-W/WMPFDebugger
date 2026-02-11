import { spawn, execSync } from "child_process";
import { createServer } from "vite";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const electronPath = require("electron");

async function main() {
  console.log("[dev] Compiling main process...");
  execSync(
    process.platform === "win32" ? "npx.cmd tsc -p tsconfig.node.json" : "npx tsc -p tsconfig.node.json",
    { stdio: "inherit" }
  );
  console.log("[dev] Main process compiled.");

  const vite = await createServer({
    configFile: "vite.config.ts",
  });
  await vite.listen();
  vite.printUrls();

  process.env.VITE_DEV_SERVER_URL = `http://localhost:${vite.config.server.port}`;

  const electron = spawn(String(electronPath), ["."], {
    stdio: "inherit",
    shell: true,
  });

  electron.on("close", () => {
    vite.close();
    process.exit();
  });
}

main();
