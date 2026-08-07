import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  BROAD_IMPACT_GLOBS,
  buildVitestCommand,
  CODE_PATH_GLOBS,
  classifyStagedFiles,
  runPrecommitTestScope,
  type VitestRunner,
} from "../lib/precommit-test-scope.ts";
import { resolveRepoRoot, type StagedFileChange } from "../lib/repo.ts";

function change(path: string, status = "M", previousPath?: string): StagedFileChange {
  return previousPath === undefined ? { status, path } : { status, path, previousPath };
}

test("classifyStagedFiles — 빈 스테이징은 skip이다", () => {
  assert.deepEqual(classifyStagedFiles([]), { mode: "skip" });
});

test("classifyStagedFiles — 비코드 경로만 스테이징되면 skip이다", () => {
  const result = classifyStagedFiles([
    change("docs/execution/radio/P0-T41-radio.md"),
    change("docs/execution/runs/P0-T41/handoff.md"),
    change("README.md"),
  ]);

  assert.deepEqual(result, { mode: "skip" });
});

test("classifyStagedFiles — 문서만 삭제되는 스테이징은 D 상태라 fail-closed로 full이다", () => {
  const result = classifyStagedFiles([change("docs/execution/runs/P0-T00/handoff.md", "D")]);

  assert.deepEqual(result, { mode: "full" });
});

test("classifyStagedFiles — 문서와 코드가 섞이면 생략되지 않고 related다", () => {
  const result = classifyStagedFiles([
    change("docs/execution/radio/P0-T41-radio.md"),
    change("harness/lib/precommit-test-scope.ts"),
  ]);

  assert.equal(result.mode, "related");
  assert.deepEqual(result.files, ["harness/lib/precommit-test-scope.ts"]);
});

test("classifyStagedFiles — 코드 경로만 스테이징되면 related이고 files는 코드 경로만 담는다", () => {
  const result = classifyStagedFiles([
    change("src/shared/lib/example.ts"),
    change("src/shared/lib/other.ts"),
  ]);

  assert.equal(result.mode, "related");
  assert.deepEqual(result.files, ["src/shared/lib/example.ts", "src/shared/lib/other.ts"]);
});

test("classifyStagedFiles — 광역 영향 파일이 다른 파일들 사이에 1개만 있어도 full로 승격한다", () => {
  const result = classifyStagedFiles([
    change("docs/execution/radio/P0-T41-radio.md"),
    change("src/shared/lib/example.ts"),
    change("package.json"),
  ]);

  assert.deepEqual(result, { mode: "full" });
});

test("classifyStagedFiles — 분류 불가한 항목(빈 문자열)이 섞이면 fail-closed로 full이다", () => {
  const result = classifyStagedFiles([
    change("docs/execution/radio/P0-T41-radio.md"),
    change(""),
  ]);

  assert.deepEqual(result, { mode: "full" });
});

test("classifyStagedFiles — 분류 불가한 항목(절대경로)이 섞이면 fail-closed로 full이다", () => {
  const result = classifyStagedFiles([change("/etc/passwd")]);

  assert.deepEqual(result, { mode: "full" });
});

test("classifyStagedFiles — 코드 파일 삭제(D)는 존재하지 않는 경로가 아니라 상태로 감지해 full로 승격한다", () => {
  const result = classifyStagedFiles([change("harness/lib/deleted-example.ts", "D")]);

  assert.deepEqual(result, { mode: "full" });
});

test("classifyStagedFiles — 코드→비코드 rename(R)은 목적지 경로만 보면 skip처럼 보이지만 상태로 full 승격한다", () => {
  const result = classifyStagedFiles([
    change("docs/notes.md", "R100", "harness/lib/foo.ts"),
  ]);

  assert.deepEqual(result, { mode: "full" });
});

test("classifyStagedFiles — 비코드 파일의 rename(R)도 블런트 규칙에 따라 full로 승격한다", () => {
  const result = classifyStagedFiles([
    change("docs/execution/runs/P0-T00/new-name.md", "R100", "docs/execution/runs/P0-T00/old-name.md"),
  ]);

  assert.deepEqual(result, { mode: "full" });
});

test("classifyStagedFiles — 일반 수정(M)만 있으면 D·R 규칙이 적용되지 않는다", () => {
  const result = classifyStagedFiles([change("src/shared/lib/example.ts", "M")]);

  assert.equal(result.mode, "related");
});

const CODE_PATH_REPRESENTATIVES: readonly string[] = [
  "src/shared/lib/example.ts",
  "tests/e2e/example.spec.ts",
  "harness/lib/example.ts",
  "tools/eslint-plugin-project/rules/example.mjs",
  "supabase/migrations/0001_example.sql",
  "config/radio-lens.json",
  "scripts/example.mjs",
  ".githooks/pre-commit",
  "next.config.ts",
  "eslint.config.mjs",
  "eslint.config.ci.mjs",
  "postcss.config.mjs",
  "playwright.config.ts",
  "components.json",
  ".prettierrc",
];

for (const representative of CODE_PATH_REPRESENTATIVES) {
  test(`classifyStagedFiles — 코드 경로 대표 항목 ${representative}은 skip이 아니다`, () => {
    const result = classifyStagedFiles([change(representative)]);

    assert.notEqual(result.mode, "skip");
  });
}

const BROAD_IMPACT_REPRESENTATIVES: readonly string[] = [
  "package.json",
  "pnpm-lock.yaml",
  "vitest.config.ts",
  "tsconfig.json",
  "config/fsd.json",
  "tests/setup-dom.ts",
];

for (const representative of BROAD_IMPACT_REPRESENTATIVES) {
  test(`classifyStagedFiles — 광역 영향 대표 항목 ${representative}은 full로 승격한다`, () => {
    const result = classifyStagedFiles([change(representative)]);

    assert.deepEqual(result, { mode: "full" });
  });
}

test("CODE_PATH_GLOBS·BROAD_IMPACT_GLOBS — 판정 모듈이 소유하는 상수로 노출된다", () => {
  assert.ok(CODE_PATH_GLOBS.length > 0);
  assert.ok(BROAD_IMPACT_GLOBS.length > 0);
});

test("buildVitestCommand — skip 판정은 실행할 명령이 없다", () => {
  assert.equal(buildVitestCommand({ mode: "skip" }), null);
});

test("buildVitestCommand — related 판정은 passWithNoTests=false를 포함한 vitest related 명령을 산출한다", () => {
  const command = buildVitestCommand({
    mode: "related",
    files: ["src/shared/lib/example.ts", "harness/lib/example.ts"],
  });

  assert.deepEqual(command, {
    args: [
      "related",
      "src/shared/lib/example.ts",
      "harness/lib/example.ts",
      "--run",
      "--passWithNoTests=false",
    ],
  });
});

test("buildVitestCommand — full 판정은 vitest run 명령을 산출한다", () => {
  const command = buildVitestCommand({ mode: "full" });

  assert.deepEqual(command, { args: ["run"] });
});

test("buildVitestCommand — related 명령은 실제 vitest에서 0건 related일 때도 exit 0으로 통과하지 않는다(passWithNoTests 강제 회피 실측)", () => {
  const command = buildVitestCommand({
    mode: "related",
    files: ["harness/lib/precommit-test-scope.ts"],
  });
  assert.ok(command !== null);

  const result = spawnSync("pnpm", ["exec", "vitest", ...command.args], {
    cwd: resolveRepoRoot(),
    encoding: "utf8",
  });

  assert.notEqual(
    result.status,
    0,
    `0건 related 실행이 exit 0으로 통과했다(vitest의 passWithNoTests 강제가 회피되지 않았다):\n${result.stdout}${result.stderr}`,
  );
});

function fakeRunner(exitCodes: readonly number[]): { runner: VitestRunner; calls: string[][] } {
  const calls: string[][] = [];
  let cursor = 0;
  const runner: VitestRunner = (args) => {
    calls.push([...args]);
    const exitCode = exitCodes[cursor] ?? 0;
    cursor += 1;
    return { exitCode };
  };
  return { runner, calls };
}

test("runPrecommitTestScope — skip 판정은 러너를 한 번도 호출하지 않고 exit 0이다", () => {
  const { runner, calls } = fakeRunner([]);

  const result = runPrecommitTestScope([], runner);

  assert.deepEqual(result, { exitCode: 0 });
  assert.deepEqual(calls, []);
});

test("runPrecommitTestScope — related 판정이 성공하면 그 결과를 그대로 반환한다", () => {
  const { runner, calls } = fakeRunner([0]);

  const result = runPrecommitTestScope([change("src/shared/lib/example.ts")], runner);

  assert.deepEqual(result, { exitCode: 0 });
  assert.deepEqual(calls, [
    ["related", "src/shared/lib/example.ts", "--run", "--passWithNoTests=false"],
  ]);
});

test("runPrecommitTestScope — related 실행이 실패하면 fail-closed로 전체 스위트를 재실행한다", () => {
  const { runner, calls } = fakeRunner([1, 0]);

  const result = runPrecommitTestScope([change("src/shared/lib/example.ts")], runner);

  assert.deepEqual(result, { exitCode: 0 });
  assert.deepEqual(calls, [
    ["related", "src/shared/lib/example.ts", "--run", "--passWithNoTests=false"],
    ["run"],
  ]);
});

test("runPrecommitTestScope — related 승격 후 full도 실패하면 그 실패를 반환한다", () => {
  const { runner, calls } = fakeRunner([1, 1]);

  const result = runPrecommitTestScope([change("src/shared/lib/example.ts")], runner);

  assert.deepEqual(result, { exitCode: 1 });
  assert.deepEqual(calls, [
    ["related", "src/shared/lib/example.ts", "--run", "--passWithNoTests=false"],
    ["run"],
  ]);
});

test("runPrecommitTestScope — full 판정은 러너를 한 번만 vitest run으로 호출한다", () => {
  const { runner, calls } = fakeRunner([0]);

  const result = runPrecommitTestScope([change("package.json")], runner);

  assert.deepEqual(result, { exitCode: 0 });
  assert.deepEqual(calls, [["run"]]);
});

test("runPrecommitTestScope — 코드 삭제(D)만 스테이징돼도 fail-closed로 전체 스위트를 실행한다", () => {
  const { runner, calls } = fakeRunner([0]);

  const result = runPrecommitTestScope([change("harness/lib/deleted-example.ts", "D")], runner);

  assert.deepEqual(result, { exitCode: 0 });
  assert.deepEqual(calls, [["run"]]);
});
