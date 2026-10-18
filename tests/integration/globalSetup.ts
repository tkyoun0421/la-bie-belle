import { spawnSync } from "node:child_process";

export default function globalSetup(): void {
  const check = spawnSync(
    process.execPath,
    [
      "--no-warnings",
      "--experimental-strip-types",
      "--import",
      "./scripts/registerModuleAlias.mjs",
      "scripts/checkIntegrationTarget.mts",
    ],
    { stdio: "inherit" },
  );

  if (check.status !== 0) {
    throw new Error(
      "integration 대상 확인을 통과하지 못해 시작하지 않는다. 바로 위 줄이 이유다.",
    );
  }
}
