import { spawnSync } from "node:child_process";
import {
  runPrecommitTestScope,
  type RunResult,
  type VitestRunner,
} from "../lib/precommit-test-scope.ts";
import { listStagedFiles, resolveRepoRoot } from "../lib/repo.ts";

function spawnVitest(root: string): VitestRunner {
  return (args: readonly string[]): RunResult => {
    const result = spawnSync("pnpm", ["exec", "vitest", ...args], {
      cwd: root,
      stdio: "inherit",
    });
    return { exitCode: result.status ?? 1 };
  };
}

const root = resolveRepoRoot();
const result = runPrecommitTestScope(listStagedFiles(root), spawnVitest(root));
process.exitCode = result.exitCode;
