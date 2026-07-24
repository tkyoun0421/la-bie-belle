import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertRunnableTask, validateIndex } from "./lib/index.mjs";

const fixtureRoot = mkdtempSync(join(tmpdir(), "la-bie-belle-v3-contract-"));
try {
  const radioPath = join(fixtureRoot, "P9-T01-radio.md");
  const radio = "# P9-T01 RADIO\n\n- 상태: Approved\n- revision: 1\n";
  writeFileSync(radioPath, radio);
  const task = {
    schema_version: 3,
    kind: "task",
    id: "P9-T01",
    phase: "P9",
    title: "v3 fixture",
    summary: "이중 승인 실행 계약을 검사한다.",
    status: "planned",
    priority: "must",
    depends_on: [],
    doc: "docs/phases/09-fixture.md",
    spec_refs: ["DOCS:SDD"],
    verification: ["fixture"],
    test_mode: "verification",
    check_ids: ["fixture"],
    tags: ["fixture"],
    updated_at: "2026-07-24",
    approval_contract: "dual-approval-v3",
    product_approval: { by: "user", at: "2026-07-24" },
    development_approval: {
      by: "user",
      at: "2026-07-24",
      radio_revision: 1,
      radio_sha256: "f".repeat(64)
    },
    radio_ref: "docs/development/P9-T01-radio.md"
  };

  assert.deepEqual(validateIndex([task]), [], "유효한 v3 planned task는 인덱스에서 허용해야 합니다");
  assert.doesNotThrow(() => assertRunnableTask([{ ...task, status: "done" }, task], task), "v3 이중 승인 task를 실행 가능으로 판정해야 합니다");
  assert.throws(() => assertRunnableTask([task], { ...task, status: "design_pending" }), /design_pending/, "design_pending은 실행할 수 없어야 합니다");
  assert.ok(radioPath, "RADIO fixture를 준비했습니다");
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log("schema v3 공통 계약 RED/GREEN 자체 검사를 통과했습니다");
