import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { checkCommitMessage, runCommitMsgGate } from "../lib/commit-msg-gate.ts";
import { createFixtureRoot, joinMessages, writeFixtureFile } from "./fixture.ts";

function messageFile(content: string): string {
  const root = createFixtureRoot();
  writeFixtureFile(root, "COMMIT_EDITMSG", content);
  return join(root, "COMMIT_EDITMSG");
}

test("commit-msg — task ID가 있으면 통과한다", () => {
  assert.deepEqual(runCommitMsgGate(messageFile("feat(P0-T31): 경량 게이트형 하네스\n")), []);
});

test("commit-msg — task ID가 없으면 차단한다", () => {
  const violations = runCommitMsgGate(messageFile("fix: 오타 수정\n"));

  assert.ok(violations.length > 0, "task ID 없는 메시지는 위반이어야 한다");
  assert.match(joinMessages(violations), /task ID/);
});

test("commit-msg — 주석 줄의 task ID는 인정하지 않는다", () => {
  const violations = runCommitMsgGate(messageFile("chore: 정리\n\n# 예: feat(P0-T31): 제목\n"));

  assert.ok(violations.length > 0, "주석 줄만 있는 경우는 위반이어야 한다");
});

test("commit-msg — 빈 메시지를 차단한다", () => {
  const violations = runCommitMsgGate(messageFile("\n\n# 주석만 있음\n"));

  assert.ok(violations.length > 0, "빈 메시지는 위반이어야 한다");
  assert.match(joinMessages(violations), /비어 있습니다/);
});

test("commit-msg — 메시지 파일이 없으면 차단한다", () => {
  const root = createFixtureRoot();

  const violations = runCommitMsgGate(join(root, "MISSING_MSG"));

  assert.ok(violations.length > 0, "파일 부재는 위반이어야 한다");
  assert.match(joinMessages(violations), /읽을 수 없습니다/);
});

test("commit-msg — task ID 자릿수 규칙을 지킨다", () => {
  assert.ok(checkCommitMessage("feat(P0-T1): 자릿수 부족").length > 0, "T 뒤 두 자리가 아니면 위반");
  assert.ok(checkCommitMessage("feat(PO-T01): 문자 오타").length > 0, "phase는 숫자여야 한다");
  assert.deepEqual(checkCommitMessage("docs(P12-T07): 정상"), []);
});
