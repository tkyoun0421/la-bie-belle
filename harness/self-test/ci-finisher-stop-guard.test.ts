import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { resolveRepoRoot } from "../lib/repo.ts";
import { createFixtureRoot, git, initGitRepo, writeFixtureFile } from "./fixture.ts";

const ENV_EXAMPLE_CONTENT = "NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321\n";

function createStopGuardRepo(): string {
  const root = createFixtureRoot();
  const source = resolveRepoRoot();
  initGitRepo(root);
  cpSync(join(source, ".claude/hooks"), join(root, ".claude/hooks"), { recursive: true });
  writeFixtureFile(root, ".env.example", ENV_EXAMPLE_CONTENT);
  git(root, ["add", "-A"]);
  git(root, ["commit", "--no-verify", "-m", "P0-T00 fixture bootstrap"]);
  return root;
}

function callStopGuard(root: string, payload: Record<string, unknown>): { status: number; output: string } {
  const result = spawnSync("bash", [join(root, ".claude/hooks/ci-finisher-stop-guard.sh")], {
    cwd: root,
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  return { status: result.status ?? 1, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

test("ci-finisher stop 가드 — 데모 값 .env가 남아 있으면 종료를 막고 삭제를 지시한다", () => {
  const root = createStopGuardRepo();
  writeFixtureFile(root, ".env", ENV_EXAMPLE_CONTENT);

  const result = callStopGuard(root, { agent_type: "ci-finisher", hook_event_name: "SubagentStop" });

  assert.match(result.output, /"decision":"block"/);
  assert.match(result.output, /rm -f \.env/);
});

test("ci-finisher stop 가드 — .env가 없으면 종료를 허용한다", () => {
  const root = createStopGuardRepo();

  const result = callStopGuard(root, { agent_type: "ci-finisher", hook_event_name: "SubagentStop" });

  assert.equal(result.output.trim(), "", `잔존 .env 없이 차단됐다:\n${result.output}`);
});

test("ci-finisher stop 가드 — 데모 값과 다른 .env에는 관여하지 않는다", () => {
  const root = createStopGuardRepo();
  writeFixtureFile(root, ".env", "SUPABASE_SERVICE_ROLE_KEY=real-secret\n");

  const result = callStopGuard(root, { agent_type: "ci-finisher", hook_event_name: "SubagentStop" });

  assert.equal(result.output.trim(), "", `사용자 .env에 관여했다:\n${result.output}`);
});

test("ci-finisher stop 가드 — stop_hook_active면 반복 차단하지 않는다", () => {
  const root = createStopGuardRepo();
  writeFixtureFile(root, ".env", ENV_EXAMPLE_CONTENT);

  const result = callStopGuard(root, {
    agent_type: "ci-finisher",
    hook_event_name: "SubagentStop",
    stop_hook_active: true,
  });

  assert.equal(result.output.trim(), "", `stop_hook_active인데 다시 차단됐다:\n${result.output}`);
});

test("ci-finisher stop 가드 — 다른 에이전트의 종료에는 관여하지 않는다", () => {
  const root = createStopGuardRepo();
  writeFixtureFile(root, ".env", ENV_EXAMPLE_CONTENT);

  const result = callStopGuard(root, { agent_type: "reviewer", hook_event_name: "SubagentStop" });

  assert.equal(result.output.trim(), "", `다른 에이전트가 차단됐다:\n${result.output}`);
});
