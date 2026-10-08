import { spawn } from "node:child_process";
import { startSeedServer } from "@scripts/e2eSeedServer.mts";

const FLOWS_DIR = "tests/e2e/";

const server = await startSeedServer();

const maestro = spawn("maestro", ["test", FLOWS_DIR], { stdio: "inherit" });

const code = await new Promise<number>((resolve) => {
  maestro.on("error", (error) => {
    console.error(`maestro 를 못 찾았다: ${error.message}`);
    resolve(1);
  });
  maestro.on("close", (exitCode) => resolve(exitCode ?? 1));
});

server.close();

process.exit(code);
