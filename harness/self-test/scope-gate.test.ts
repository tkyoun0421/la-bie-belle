import assert from "node:assert/strict";
import { test } from "node:test";
import { globToRegExp, matchesAnyGlob } from "../lib/glob.ts";
import { parseAllowedPaths } from "../lib/radio-doc.ts";
import { checkStagedPaths, runScopeGate } from "../lib/scope-gate.ts";
import {
  createFixtureRoot,
  git,
  initGitRepo,
  joinMessages,
  makeRadioMarkdown,
  makeTask,
  writeFixtureFile,
  writeIndexRecords,
  writeRadio,
} from "./fixture.ts";

function stagedFixture(allowedPaths: readonly string[], stagedPath: string): string {
  const root = createFixtureRoot();
  initGitRepo(root);
  const sha256 = writeRadio(root, "P0-T01", allowedPaths);
  writeIndexRecords(root, [
    makeTask({
      status: "in_progress",
      development_approval: {
        by: "user",
        at: "2026-08-03",
        radio_revision: 1,
        radio_sha256: sha256,
      },
    }),
  ]);
  writeFixtureFile(root, stagedPath, "내용\n");
  git(root, ["add", "--", stagedPath]);
  return root;
}

test("gate:scope — 허용 경로 안의 staged 파일은 통과한다", () => {
  const root = stagedFixture(["harness/**", "docs/execution/runs/P0-T01/**"], "harness/lib/new.ts");

  assert.deepEqual(runScopeGate(root), []);
});

test("gate:scope — 허용 경로 밖의 staged 파일을 차단한다", () => {
  const root = stagedFixture(["harness/**"], "src/app/page.tsx");

  const violations = runScopeGate(root);

  assert.ok(violations.length > 0, "허용 경로 밖 변경은 위반이어야 한다");
  assert.match(joinMessages(violations), /src\/app\/page\.tsx/);
});

test("gate:scope — 변경 허용 경로 절이 없으면 차단한다", () => {
  const root = createFixtureRoot();
  initGitRepo(root);
  writeFixtureFile(
    root,
    "docs/execution/radio/P0-T01-radio.md",
    "# RADIO\n\n## Requirements\n\n- 없음\n",
  );
  writeIndexRecords(root, [makeTask({ status: "in_progress" })]);

  const violations = runScopeGate(root);

  assert.ok(violations.length > 0, "허용 경로 선언이 없으면 위반이어야 한다");
  assert.match(joinMessages(violations), /변경 허용 경로/);
});

test("gate:scope — in_progress task가 없으면 통과한다", () => {
  const root = createFixtureRoot();
  initGitRepo(root);
  writeIndexRecords(root, [makeTask()]);
  writeFixtureFile(root, "anywhere.txt", "메타 커밋\n");
  git(root, ["add", "--", "anywhere.txt"]);

  assert.deepEqual(runScopeGate(root), []);
});

test("gate:scope — 여러 파일 중 하나만 벗어나도 차단한다", () => {
  const errors = checkStagedPaths(["harness/lib/a.ts", "docs/product/PRD.md"], ["harness/**"]);

  assert.equal(errors.length, 1);
  assert.match(errors.join("\n"), /docs\/product\/PRD\.md/);
});

test("RADIO 파서 — 첫 코드블록의 glob 목록만 읽는다", () => {
  const markdown = makeRadioMarkdown(["harness/**", "package.json"]);

  assert.deepEqual(parseAllowedPaths(markdown), ["harness/**", "package.json"]);
  assert.deepEqual(parseAllowedPaths("# RADIO\n\n## Requirements\n\n```\nharness/**\n```\n"), []);
});

test("glob — 경로 구분자를 지키며 변환한다", () => {
  assert.ok(globToRegExp("harness/**").test("harness/lib/a.ts"));
  assert.ok(globToRegExp("harness/**").test("harness/a.ts"));
  assert.ok(!globToRegExp("harness/**").test("docs/harness/a.ts"));
  assert.ok(globToRegExp("package.json").test("package.json"));
  assert.ok(!globToRegExp("package.json").test("harness/package.json"));
  assert.ok(globToRegExp("docs/*/index.md").test("docs/product/index.md"));
  assert.ok(!globToRegExp("docs/*/index.md").test("docs/a/b/index.md"));
  assert.ok(globToRegExp("docs/**/index.md").test("docs/a/b/index.md"));
  assert.ok(globToRegExp("docs/**/index.md").test("docs/index.md"));
  assert.ok(!globToRegExp("*.md").test("docs/a.md"));
  assert.ok(matchesAnyGlob("package.json", ["harness/**", "package.json"]));
  assert.ok(!matchesAnyGlob("pnpm-lock.yaml", ["harness/**", "package.json"]));
});
