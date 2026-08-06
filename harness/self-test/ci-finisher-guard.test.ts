import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { resolveRepoRoot } from "../lib/repo.ts";
import { createFixtureRoot, git, initGitRepo, makeTask, writeFixtureFile, writeIndexRecords } from "./fixture.ts";

const ENV_EXAMPLE_CONTENT = "NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321\n";

function createGuardRepo(taskStatus: "planned" | "in_progress" = "planned"): string {
  const root = createFixtureRoot();
  const source = resolveRepoRoot();
  initGitRepo(root);
  cpSync(join(source, ".claude/hooks"), join(root, ".claude/hooks"), { recursive: true });
  writeFixtureFile(root, ".gitignore", ".env\n.env.*\n!.env.example\n");
  writeFixtureFile(root, ".env.example", ENV_EXAMPLE_CONTENT);
  writeIndexRecords(root, [makeTask({ status: taskStatus })]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "--no-verify", "-m", "P0-T00 fixture bootstrap"]);
  return root;
}

function callGuard(root: string, payload: Record<string, unknown>): { status: number; output: string } {
  const result = spawnSync("bash", [join(root, ".claude/hooks/ci-finisher-guard.sh")], {
    cwd: root,
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  return { status: result.status ?? 1, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function bashCall(command: string, agentType: string | null = "ci-finisher"): Record<string, unknown> {
  return { ...(agentType === null ? {} : { agent_type: agentType }), tool_name: "Bash", tool_input: { command } };
}

function editCall(filePath: string, agentType: string | null = "ci-finisher"): Record<string, unknown> {
  return { ...(agentType === null ? {} : { agent_type: agentType }), tool_name: "Edit", tool_input: { file_path: filePath } };
}

test("ci-finisher 가드 — 메인 세션과 다른 에이전트에는 관여하지 않는다", () => {
  const root = createGuardRepo();

  const mainSession = callGuard(root, bashCall("git push --force origin main", null));
  const otherAgent = callGuard(root, editCall("docs/execution/reviews/P0-T01-review.json", "reviewer"));

  assert.equal(mainSession.output.trim(), "", `메인 세션이 차단됐다:\n${mainSession.output}`);
  assert.equal(otherAgent.output.trim(), "", `다른 에이전트가 차단됐다:\n${otherAgent.output}`);
});

test("ci-finisher 가드 — 정본 push 절차는 통과시킨다", () => {
  const root = createGuardRepo();

  const result = callGuard(root, bashCall("cp .env.example .env && git push origin main; rm -f .env"));

  assert.equal(result.output.trim(), "", `정본 절차가 차단됐다:\n${result.output}`);
});

test("ci-finisher 가드 — force push를 차단한다", () => {
  const root = createGuardRepo();

  for (const command of [
    "git push --force origin main",
    "git push -f origin main",
    "git push origin +main",
    "git push --force-with-lease origin main",
  ]) {
    const result = callGuard(root, bashCall(command));
    assert.match(result.output, /"permissionDecision":"deny"/, `통과됐다: ${command}`);
    assert.match(result.output, /force push/);
  }
});

test("ci-finisher 가드 — 이력 재작성을 차단한다", () => {
  const root = createGuardRepo();

  for (const command of ["git rebase -i HEAD~2", "git commit --amend --no-edit", "git reset --hard HEAD~1"]) {
    const result = callGuard(root, bashCall(command));
    assert.match(result.output, /"permissionDecision":"deny"/, `통과됐다: ${command}`);
    assert.match(result.output, /이력 재작성/);
  }
});

test("ci-finisher 가드 — .env 스테이징은 차단하고 .env.example은 허용한다", () => {
  const root = createGuardRepo();

  const denied = callGuard(root, bashCall("git add .env"));
  const allowed = callGuard(root, bashCall("git add .env.example"));

  assert.match(denied.output, /"permissionDecision":"deny"/);
  assert.equal(allowed.output.trim(), "", `.env.example 스테이징이 차단됐다:\n${allowed.output}`);
});

test("ci-finisher 가드 — in_progress task가 있으면 커밋을 차단한다", () => {
  const inProgressRepo = createGuardRepo("in_progress");
  const plannedRepo = createGuardRepo("planned");
  const command = 'git commit -m "fix(P0-T01): CI 워크플로 정합"';

  const denied = callGuard(inProgressRepo, bashCall(command));
  const allowed = callGuard(plannedRepo, bashCall(command));

  assert.match(denied.output, /"permissionDecision":"deny"/);
  assert.match(denied.output, /in_progress/);
  assert.equal(allowed.output.trim(), "", `in_progress 없는 커밋이 차단됐다:\n${allowed.output}`);
});

test("ci-finisher 가드 — .env가 스테이징된 상태의 커밋을 차단한다", () => {
  const root = createGuardRepo();
  writeFixtureFile(root, ".env", ENV_EXAMPLE_CONTENT);
  git(root, ["add", "-f", ".env"]);

  const result = callGuard(root, bashCall('git commit -m "fix(P0-T01): 재push"'));

  assert.match(result.output, /"permissionDecision":"deny"/);
  assert.match(result.output, /\.env/);
});

test("ci-finisher 가드 — 조정자 소유 문서와 훅 구성의 편집을 차단한다", () => {
  const root = createGuardRepo();

  for (const filePath of [
    "docs/execution/reviews/P0-T01-review.json",
    "docs/execution/radio/P0-T01-radio.md",
    "docs/execution/phases/index.jsonl",
    ".claude/hooks/ci-finisher-guard.sh",
    ".claude/agents/ci-finisher.md",
  ]) {
    const result = callGuard(root, editCall(filePath));
    assert.match(result.output, /"permissionDecision":"deny"/, `통과됐다: ${filePath}`);
  }
});

test("ci-finisher 가드 — 허용 범위의 편집은 통과시킨다", () => {
  const root = createGuardRepo();

  for (const filePath of [".github/workflows/ci.yml", "package.json", "src/shared/config/site.ts"]) {
    const result = callGuard(root, editCall(filePath));
    assert.equal(result.output.trim(), "", `허용 경로가 차단됐다: ${filePath}\n${result.output}`);
  }
});

test("ci-finisher 가드 — 셸을 통한 조정자 소유 경로 변조를 차단한다", () => {
  const root = createGuardRepo();

  for (const command of [
    "echo tampered > docs/execution/radio/P0-T01-radio.md",
    "sed -i '' 's/critical/low/' docs/execution/reviews/P0-T01-review.json",
    "rm -rf docs/execution/runs/P0-T01",
    "chmod -x .claude/hooks/ci-finisher-guard.sh",
    "git checkout HEAD~1 -- docs/execution/phases/index.jsonl",
  ]) {
    const result = callGuard(root, bashCall(command));
    assert.match(result.output, /"permissionDecision":"deny"/, `통과됐다: ${command}`);
  }
});

test("ci-finisher 가드 — 조정자 소유 경로의 읽기는 통과시킨다", () => {
  const root = createGuardRepo();

  for (const command of [
    "grep -n severity docs/execution/reviews/P0-T01-review.json",
    "cat docs/execution/phases/index.jsonl",
    "gh run watch 12345 --exit-status",
  ]) {
    const result = callGuard(root, bashCall(command));
    assert.equal(result.output.trim(), "", `읽기 명령이 차단됐다: ${command}\n${result.output}`);
  }
});
