import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { artifactFreshness, collect } from "../dashboard/collect.ts";
import { DASHBOARD_PATH } from "../dashboard/render.ts";
import { readTextFile, resolveRepoRoot } from "../lib/repo.ts";
import {
  createFixtureRoot,
  git,
  initGitRepo,
  makeHandoffMarkdown,
  makePhase,
  makeTask,
  makeTddEvidence,
  writeFixtureFile,
  writeFixtureJson,
  writeIndexRecords,
  writeRadio,
} from "./fixture.ts";

const NOW = new Date("2026-08-04T00:00:00.000Z");
const SCORED_GATE_IDS = ["gate:index", "gate:radio", "gate:handoff", "gate:tdd"];

function markerHtml(commit: string): string {
  return `<!doctype html>\n<html lang="ko"><head>\n<meta name="base-commit" content="${commit}">\n</head><body></body></html>\n`;
}

function commitAll(root: string, message: string): string {
  git(root, ["add", "--all"]);
  git(root, ["commit", "-m", message]);
  return git(root, ["rev-parse", "HEAD"]).trim();
}

test("collect — git 저장소가 아니어도 생성을 중단하지 않는다", () => {
  const root = createFixtureRoot();

  const collection = collect(root, NOW);

  assert.equal(collection.generatedAt, NOW.toISOString());
  assert.equal(collection.git.headCommit, null);
  assert.equal(collection.freshness.kind, "no-head");
  assert.deepEqual(
    collection.gates.map((gate) => gate.id),
    SCORED_GATE_IDS,
  );
  assert.deepEqual(
    collection.referenceGates.map((gate) => gate.id),
    ["gate:scope", "commit-msg"],
  );
  assert.ok(collection.notices.length > 0, "누락 알림이 있어야 한다");
});

test("collect — 실행이 깨진 게이트는 실행 실패로 남고 나머지 수집은 계속된다", () => {
  const root = createFixtureRoot();
  const radioSha256 = writeRadio(root, "P0-T01", ["src/**"]);
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

  const collection = collect(root, NOW);
  const scope = collection.referenceGates.find((gate) => gate.id === "gate:scope");

  assert.ok(scope !== undefined, "gate:scope 결과가 있어야 한다");
  assert.equal(scope.errored, true);
  assert.equal(scope.passed, false);
  assert.match(collection.notices.join("\n"), /gate:scope/u);
});

test("collect — 재생성 준수는 기존 산출물의 기록 커밋으로 판정한다", () => {
  const root = createFixtureRoot();
  initGitRepo(root);
  writeIndexRecords(root, [makePhase()]);
  const first = commitAll(root, "seed P0-T00");
  assert.deepEqual(artifactFreshness(root, first), { kind: "no-previous" });

  writeFixtureFile(root, DASHBOARD_PATH, markerHtml(first));
  const second = commitAll(root, "dashboard P0-T00");
  assert.equal(artifactFreshness(root, second).kind, "fresh");

  writeIndexRecords(root, [makePhase({ status: "in_progress" })]);
  const third = commitAll(root, "state change P0-T00");
  const stale = artifactFreshness(root, third);
  assert.equal(stale.kind, "stale");
  if (stale.kind === "stale") {
    assert.equal(stale.recordedCommit, first);
    assert.equal(stale.missedCommits.length, 1);
    assert.ok(third.startsWith(stale.missedCommits[0] ?? "!"), "놓친 커밋은 상태 변경 커밋이다");
  }

  writeIndexRecords(root, [makePhase({ status: "done" })]);
  writeFixtureFile(root, DASHBOARD_PATH, markerHtml(third));
  const fourth = commitAll(root, "state and regen P0-T00");
  assert.equal(artifactFreshness(root, fourth).kind, "fresh");

  writeFixtureFile(
    root,
    DASHBOARD_PATH,
    "<!doctype html><html><head></head><body></body></html>\n",
  );
  commitAll(root, "marker broken P0-T00");
  const collection = collect(root, NOW);
  assert.equal(collection.freshness.kind, "unreadable");
  assert.equal(collection.git.headSubject, "marker broken P0-T00");
});

test("main — 생성 명령이 marker를 포함한 산출물을 쓰고 경로를 출력한다", () => {
  const root = createFixtureRoot();
  initGitRepo(root);
  cpSync(join(resolveRepoRoot(), "harness"), join(root, "harness"), { recursive: true });
  writeFixtureFile(
    root,
    "package.json",
    `${JSON.stringify({ name: "dashboard-fixture", private: true, type: "module" }, null, 2)}\n`,
  );
  writeIndexRecords(root, [makePhase(), makeTask({ id: "P0-T01", status: "proposed" })]);
  commitAll(root, "seed P0-T01");

  const stdout = execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--disable-warning=ExperimentalWarning",
      join(root, "harness/dashboard/main.ts"),
    ],
    { encoding: "utf8" },
  );

  assert.equal(stdout.trim(), DASHBOARD_PATH);
  const html = readTextFile(root, DASHBOARD_PATH);
  assert.ok(html !== null, "산출물이 만들어져야 한다");
  assert.match(html, /^<!doctype html>/iu);
  assert.match(html, /<meta name="base-commit" content="[0-9a-f]{40}">/u);
});
