import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { resolveRepoRoot } from "../lib/repo.ts";
import {
  createFixtureRoot,
  git,
  initGitRepo,
  makeHandoffMarkdown,
  makeTask,
  makeTddEvidence,
  writeFixtureFile,
  writeFixtureJson,
  writeIndexRecords,
  writeRadio,
} from "./fixture.ts";

const ALLOWED_GLOBS = ["docs/execution/runs/**", "src/allowed/**"];

function createHookRepo(): string {
  const root = createFixtureRoot();
  const source = resolveRepoRoot();
  initGitRepo(root);
  cpSync(join(source, "harness"), join(root, "harness"), { recursive: true });
  cpSync(join(source, ".githooks"), join(root, ".githooks"), { recursive: true });
  writeFixtureFile(
    root,
    "package.json",
    `${JSON.stringify({ name: "hook-fixture", private: true, type: "module" }, null, 2)}\n`,
  );

  const radioSha256 = writeRadio(root, "P0-T01", ALLOWED_GLOBS);
  writeIndexRecords(root, [
    makeTask({
      status: "in_progress",
      development_approval: {
        by: "user",
        at: "2026-08-03",
        radio_revision: 1,
        radio_sha256: radioSha256,
      },
    }),
  ]);
  writeFixtureJson(root, "docs/execution/runs/P0-T01/tdd.json", makeTddEvidence());
  writeFixtureFile(root, "docs/execution/runs/P0-T01/handoff.md", makeHandoffMarkdown("P0-T01"));

  git(root, ["add", "-A"]);
  git(root, ["commit", "--no-verify", "-m", "P0-T00 fixture bootstrap"]);
  git(root, ["config", "core.hooksPath", ".githooks"]);
  return root;
}

function tryCommit(root: string, message: string): { status: number; output: string } {
  const result = spawnSync("git", ["-C", root, "commit", "-m", message], { encoding: "utf8" });
  return { status: result.status ?? 1, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

test("훅 수용 — 승인 범위 안의 정상 커밋은 --no-verify 없이 성공한다", () => {
  const root = createHookRepo();
  writeFixtureFile(root, "src/allowed/feature.ts", "export const value = 1;\n");
  git(root, ["add", "--", "src/allowed/feature.ts"]);

  const result = tryCommit(root, "feat(P0-T01): 허용 경로 안 변경");

  assert.equal(result.status, 0, `정상 커밋이 실패했다:\n${result.output}`);
  assert.match(git(root, ["log", "-1", "--pretty=%s"]), /P0-T01/);
});

test("훅 수용 — 변경 허용 경로 밖 커밋을 거부한다", () => {
  const root = createHookRepo();
  writeFixtureFile(root, "src/forbidden/secret.ts", "export const value = 2;\n");
  git(root, ["add", "--", "src/forbidden/secret.ts"]);

  const result = tryCommit(root, "feat(P0-T01): 허용 경로 밖 변경");

  assert.notEqual(result.status, 0, "범위 밖 커밋이 통과했다");
  assert.match(result.output, /변경 허용 경로 밖/);
});

test("훅 수용 — task ID 없는 커밋 메시지를 거부한다", () => {
  const root = createHookRepo();
  writeFixtureFile(root, "src/allowed/feature.ts", "export const value = 3;\n");
  git(root, ["add", "--", "src/allowed/feature.ts"]);

  const result = tryCommit(root, "chore: task ID 없음");

  assert.notEqual(result.status, 0, "task ID 없는 커밋이 통과했다");
  assert.match(result.output, /task ID/);
});

test("훅 수용 — TDD 증거가 없으면 커밋을 거부한다", () => {
  const root = createHookRepo();
  rmSync(join(root, "docs/execution/runs/P0-T01/tdd.json"));
  git(root, ["add", "-A"]);

  const result = tryCommit(root, "feat(P0-T01): 증거 없는 커밋");

  assert.notEqual(result.status, 0, "TDD 증거 없는 커밋이 통과했다");
  assert.match(result.output, /tdd\.json/);
});

test("훅 수용 — RADIO 본문이 바뀌면 커밋을 거부한다", () => {
  const root = createHookRepo();
  writeFixtureFile(root, "docs/execution/runs/P0-T01/note.md", "메모\n");
  writeFixtureFile(root, "docs/execution/radio/P0-T01-radio.md", "# 변조된 RADIO\n");
  git(root, ["add", "--", "docs/execution/runs/P0-T01/note.md"]);

  const result = tryCommit(root, "docs(P0-T01): 변조된 RADIO 상태의 커밋");

  assert.notEqual(result.status, 0, "RADIO 변조 상태의 커밋이 통과했다");
  assert.match(result.output, /해시/);
});
