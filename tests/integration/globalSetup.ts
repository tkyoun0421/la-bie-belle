import { spawnSync } from "node:child_process";

function runScript(
  script: string,
  stdout: "inherit" | "pipe",
): { status: number | null; stdout: string } {
  const result = spawnSync(
    process.execPath,
    [
      "--no-warnings",
      "--experimental-strip-types",
      "--import",
      "./scripts/registerModuleAlias.mjs",
      script,
    ],
    { stdio: ["inherit", stdout, "inherit"], encoding: "utf8" },
  );

  return { status: result.status, stdout: result.stdout ?? "" };
}

function applyEnvLines(output: string): void {
  for (const line of output.split("\n")) {
    const separator = line.indexOf("=");
    if (separator > 0) {
      process.env[line.slice(0, separator)] = line.slice(separator + 1).trim();
    }
  }
}

export default function globalSetup(): void {
  const check = runScript("scripts/checkIntegrationTarget.mts", "inherit");
  if (check.status !== 0) {
    throw new Error(
      "integration 대상 확인을 통과하지 못해 시작하지 않는다. 바로 위 줄이 이유다.",
    );
  }

  const runEnv = runScript("scripts/integrationRunEnv.mts", "pipe");
  if (runEnv.status !== 0) {
    throw new Error("이번 회차의 runId 를 만들지 못했다. 바로 위 줄이 이유다.");
  }
  applyEnvLines(runEnv.stdout);
}
