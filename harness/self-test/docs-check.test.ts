import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkDependencyCycles,
  checkHeadingTitles,
  checkInternalLinks,
  checkSpecRefs,
  runDocsCheck,
} from "../lib/docs-check.ts";
import { resolveRepoRoot } from "../lib/repo.ts";
import { createFixtureRoot, indexEntriesOf, joinMessages, makeTask, writeFixtureFile } from "./fixture.ts";

test("check:docs — 순환 depends_on을 위반 1건으로 검출한다", () => {
  const entries = indexEntriesOf([
    makeTask({ id: "A", title: "A", depends_on: ["B"] }),
    makeTask({ id: "B", title: "B", depends_on: ["A"] }),
  ]);

  const violations = checkDependencyCycles(entries);

  assert.equal(violations.length, 1);
  assert.match(joinMessages(violations), /A/);
  assert.match(joinMessages(violations), /B/);
});

test("check:docs — index 제목과 phase heading 제목이 다르면 위반 1건이다", () => {
  const root = createFixtureRoot();
  writeFixtureFile(root, "docs/execution/phases/00-foundation.md", "### P0-T01. 다른 제목\n");
  const entries = indexEntriesOf([makeTask({ title: "원래 제목" })]);

  const violations = checkHeadingTitles(root, entries);

  assert.equal(violations.length, 1);
  assert.match(joinMessages(violations), /원래 제목/);
  assert.match(joinMessages(violations), /다른 제목/);
});

test("check:docs — product_approval 없는 task는 heading 검사에서 면제한다", () => {
  const root = createFixtureRoot();
  writeFixtureFile(root, "docs/execution/phases/00-foundation.md", "");
  const entries = indexEntriesOf([makeTask({ title: "미승인", product_approval: undefined })]);

  const violations = checkHeadingTitles(root, entries);

  assert.deepEqual(violations, []);
});

test("check:docs — 존재하지 않는 ADR 참조를 위반 1건으로 검출한다", () => {
  const root = createFixtureRoot();
  writeFixtureFile(root, "docs/standards/adr/0001-something.md", "");
  writeFixtureFile(root, "docs/product/PRD.md", "");
  writeFixtureFile(root, "docs/product/DOMAIN.md", "");
  const entries = indexEntriesOf([makeTask({ spec_refs: ["ADR:9999"] })]);

  const violations = checkSpecRefs(root, entries);

  assert.equal(violations.length, 1);
  assert.match(joinMessages(violations), /ADR:9999/);
});

test("check:docs — 존재하지 않는 파일로의 상대 링크를 위반 1건으로 검출한다", () => {
  const root = createFixtureRoot();
  writeFixtureFile(root, "docs/example.md", "[깨진 링크](./missing-file.md)\n");

  const violations = checkInternalLinks(root);

  assert.equal(violations.length, 1);
  assert.match(joinMessages(violations), /missing-file\.md/);
});

test("check:docs — 오탐 대조군: 실제 저장소는 위반 0건으로 통과한다", () => {
  const violations = runDocsCheck(resolveRepoRoot());

  assert.deepEqual(violations, []);
});
