import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BROAD_IMPACT_GLOBS,
  buildVitestCommand,
  CODE_PATH_GLOBS,
  classifyStagedFiles,
  runPrecommitTestScope,
  type VitestRunner,
} from "../lib/precommit-test-scope.ts";

test("classifyStagedFiles — 빈 스테이징은 skip이다", () => {
  assert.deepEqual(classifyStagedFiles([]), { mode: "skip" });
});

test("classifyStagedFiles — 비코드 경로만 스테이징되면 skip이다", () => {
  const result = classifyStagedFiles([
    "docs/execution/radio/P0-T41-radio.md",
    "docs/execution/runs/P0-T41/handoff.md",
    "README.md",
  ]);

  assert.deepEqual(result, { mode: "skip" });
});

test("classifyStagedFiles — 문서만 삭제되는 스테이징도 skip이다", () => {
  const result = classifyStagedFiles(["docs/execution/runs/P0-T00/handoff.md"]);

  assert.deepEqual(result, { mode: "skip" });
});

test("classifyStagedFiles — 문서와 코드가 섞이면 생략되지 않고 related다", () => {
  const result = classifyStagedFiles([
    "docs/execution/radio/P0-T41-radio.md",
    "harness/lib/precommit-test-scope.ts",
  ]);

  assert.equal(result.mode, "related");
  assert.deepEqual(result.files, ["harness/lib/precommit-test-scope.ts"]);
});

test("classifyStagedFiles — 코드 경로만 스테이징되면 related이고 files는 코드 경로만 담는다", () => {
  const result = classifyStagedFiles(["src/shared/lib/example.ts", "src/shared/lib/other.ts"]);

  assert.equal(result.mode, "related");
  assert.deepEqual(result.files, ["src/shared/lib/example.ts", "src/shared/lib/other.ts"]);
});

test("classifyStagedFiles — 광역 영향 파일이 다른 파일들 사이에 1개만 있어도 full로 승격한다", () => {
  const result = classifyStagedFiles([
    "docs/execution/radio/P0-T41-radio.md",
    "src/shared/lib/example.ts",
    "package.json",
  ]);

  assert.deepEqual(result, { mode: "full" });
});

test("classifyStagedFiles — 분류 불가한 항목(빈 문자열)이 섞이면 fail-closed로 full이다", () => {
  const result = classifyStagedFiles(["docs/execution/radio/P0-T41-radio.md", ""]);

  assert.deepEqual(result, { mode: "full" });
});

test("classifyStagedFiles — 분류 불가한 항목(절대경로)이 섞이면 fail-closed로 full이다", () => {
  const result = classifyStagedFiles(["/etc/passwd"]);

  assert.deepEqual(result, { mode: "full" });
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
    const result = classifyStagedFiles([representative]);

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
    const result = classifyStagedFiles([representative]);

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

test("buildVitestCommand — related 판정은 vitest related 명령을 산출한다", () => {
  const command = buildVitestCommand({
    mode: "related",
    files: ["src/shared/lib/example.ts", "harness/lib/example.ts"],
  });

  assert.deepEqual(command, {
    args: ["related", "src/shared/lib/example.ts", "harness/lib/example.ts", "--run"],
  });
});

test("buildVitestCommand — full 판정은 vitest run 명령을 산출한다", () => {
  const command = buildVitestCommand({ mode: "full" });

  assert.deepEqual(command, { args: ["run"] });
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

  const result = runPrecommitTestScope(["src/shared/lib/example.ts"], runner);

  assert.deepEqual(result, { exitCode: 0 });
  assert.deepEqual(calls, [["related", "src/shared/lib/example.ts", "--run"]]);
});

test("runPrecommitTestScope — related 실행이 실패하면 fail-closed로 전체 스위트를 재실행한다", () => {
  const { runner, calls } = fakeRunner([1, 0]);

  const result = runPrecommitTestScope(["src/shared/lib/example.ts"], runner);

  assert.deepEqual(result, { exitCode: 0 });
  assert.deepEqual(calls, [["related", "src/shared/lib/example.ts", "--run"], ["run"]]);
});

test("runPrecommitTestScope — related 승격 후 full도 실패하면 그 실패를 반환한다", () => {
  const { runner, calls } = fakeRunner([1, 1]);

  const result = runPrecommitTestScope(["src/shared/lib/example.ts"], runner);

  assert.deepEqual(result, { exitCode: 1 });
  assert.deepEqual(calls, [["related", "src/shared/lib/example.ts", "--run"], ["run"]]);
});

test("runPrecommitTestScope — full 판정은 러너를 한 번만 vitest run으로 호출한다", () => {
  const { runner, calls } = fakeRunner([0]);

  const result = runPrecommitTestScope(["package.json"], runner);

  assert.deepEqual(result, { exitCode: 0 });
  assert.deepEqual(calls, [["run"]]);
});
