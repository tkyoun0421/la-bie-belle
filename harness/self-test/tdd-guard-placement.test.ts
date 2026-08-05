import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { resolveRepoRoot } from "../lib/repo.ts";
import { createFixtureRoot, git, initGitRepo, writeFixtureFile, writeFixtureJson } from "./fixture.ts";

const FSD_CONTRACT = {
  layers: ["app", "views", "widgets", "features", "entities", "shared"],
  segments: {
    model: { unitTest: "required", runtimeExports: true },
  },
  testPlacement: { directory: "__tests__", suffix: ".test" },
};

function createGuardRepo(): string {
  const root = createFixtureRoot();
  const source = resolveRepoRoot();
  initGitRepo(root);
  cpSync(join(source, ".claude/hooks"), join(root, ".claude/hooks"), { recursive: true });
  writeFixtureJson(root, "config/fsd.json", FSD_CONTRACT);
  writeFixtureFile(root, "src/entities/foo/model/foo.ts", "export const value = 1;\n");
  git(root, ["add", "-A"]);
  git(root, ["commit", "--no-verify", "-m", "P0-T00 fixture bootstrap"]);
  return root;
}

function callGuard(root: string, filePath: string): { status: number; output: string } {
  const payload = JSON.stringify({ tool_input: { file_path: filePath } });
  const result = spawnSync("bash", [join(root, ".claude/hooks/tdd-guard.sh")], {
    cwd: root,
    input: payload,
    encoding: "utf8",
  });
  return { status: result.status ?? 1, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

test("tdd-guard 배치 재현 — __tests__ 하위 배치는 통과시킨다", () => {
  const root = createGuardRepo();
  writeFixtureFile(root, "src/entities/foo/model/__tests__/foo.test.ts", "export {};\n");

  const result = callGuard(root, "src/entities/foo/model/foo.ts");

  assert.equal(result.output.trim(), "", `정상 배치인데 거부됐다:\n${result.output}`);
});

test("tdd-guard 배치 재현 — colocated 테스트는 거부한다", () => {
  const root = createGuardRepo();
  writeFixtureFile(root, "src/entities/foo/model/foo.test.ts", "export {};\n");

  const result = callGuard(root, "src/entities/foo/model/foo.ts");

  assert.match(result.output, /"permissionDecision":"deny"/);
  assert.match(result.output, /__tests__/);
});

test("tdd-guard 배치 재현 — 루트 tests/ 동명 파일은 거부한다", () => {
  const root = createGuardRepo();
  writeFixtureFile(root, "tests/foo.test.ts", "export {};\n");

  const result = callGuard(root, "src/entities/foo/model/foo.ts");

  assert.match(result.output, /"permissionDecision":"deny"/);
});
