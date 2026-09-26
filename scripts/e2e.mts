// `pnpm e2e`가 부르는 자리다. 시드 서버를 띄우고 Maestro를 돌리고, 끝나면 서버를 내린다.
//
// 서버를 여기서 감싸는 것은 플로우가 그것 없이는 한 줄도 못 지나가기 때문이다 —
// `tests/e2e/scripts/seed-session.js`가 매 플로우의 첫 스텝에서 그 서버를 부른다. 사람이
// 따로 띄우게 두면 「띄우는 것을 잊어 빨간불」이 플로우 실패와 구별이 안 된다.
//
// 근거는 `docs/4-test/execution.md`의 「`pnpm e2e`」 절이다.

import { spawn } from "node:child_process";
import { startSeedServer } from "@scripts/e2e-seed-server.mts";

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
