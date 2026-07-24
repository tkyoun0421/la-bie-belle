import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { assertRunnableTask, loadIndex, repoRootFrom, validateIndex } from "./lib/index.mjs";

const root = repoRootFrom(import.meta.url);
const requiredText = new Map([
  ["docs/WORKFLOW.md", ["기획 인터뷰", "RADIO 개발 인터뷰", "다음 task를 자동 선택하지 않는다"]],
  ["AGENTS.md", ["트랙 A1: 기획 인터뷰", "트랙 A2: RADIO 개발 인터뷰", "트랙 B: 자율 개발 루프"]],
  [".agents/skills/la-bie-belle-product-interview/SKILL.md", ["한 차례에 결정 주제 하나", "`design_pending`"]],
  [".agents/skills/la-bie-belle-development-interview/SKILL.md", ["Requirements, Architecture, Data model, Interface, Optimizations", "SHA-256"]],
  [".agents/skills/la-bie-belle-harness/SKILL.md", ["자율 실행", "다음 작업을 선택하거나 시작하지 않는다"]]
]);
for (const [path, fragments] of requiredText) {
  const source = readFileSync(join(root, path), "utf8");
  for (const fragment of fragments) {
    if (!source.includes(fragment)) throw new Error(`투트랙 운영 계약에 필수 문구가 없습니다: ${path} -> ${fragment}`);
  }
}

const { entries } = loadIndex(root);
const errors = validateIndex(entries);
if (errors.length) throw new Error(errors.join("; "));
const designPending = entries.find((entry) => entry.kind === "task" && entry.status === "design_pending");
if (!designPending) throw new Error("개발 인터뷰를 기다리는 design_pending 작업이 필요합니다");
let designPendingRejected = false;
try {
  assertRunnableTask(entries, designPending, root);
} catch (error) {
  designPendingRejected = error.message.includes("design_pending") && error.message.includes("실행할 수 없습니다");
}
if (!designPendingRejected) throw new Error("design_pending 작업이 실행 경계에서 거부되지 않았습니다");

const noTask = spawnSync(process.execPath, [join(root, ".agents/harness/scripts/run.mjs")], {
  cwd: root,
  encoding: "utf8"
});
const noTaskOutput = `${noTask.stdout ?? ""}${noTask.stderr ?? ""}`;
if (noTask.status === 0 || !noTaskOutput.includes("자동 선택하지 않습니다")) {
  throw new Error(`runner가 task ID 없는 자동 선택을 거부하지 않았습니다\n${noTaskOutput}`);
}

const fixtureDir = mkdtempSync(join(tmpdir(), "la-bie-belle-approval-"));
try {
  const fixturePath = join(fixtureDir, "index.jsonl");
  const template = entries.find((entry) => entry.id === "P0-T28");
  const fixtureEntries = [
    {
      ...template,
      kind: "task",
      id: "P0-T28",
      phase: "P9",
      title: "승인 인계 fixture",
      summary: "승인된 명시 task 실행 계약을 검사한다.",
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
      radio_ref: "docs/development/P0-T28-radio.md"
    }
  ];
  writeFileSync(fixturePath, `${fixtureEntries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  const explicit = spawnSync(process.execPath, [
    join(root, ".agents/harness/scripts/run.mjs"),
    "--index",
    fixturePath,
    "--task",
    "P0-T28"
  ], { cwd: root, encoding: "utf8" });
  if (explicit.status !== 0 || !explicit.stdout.includes("\"status\": \"selected\"")) {
    throw new Error(`승인된 명시 task가 선택되지 않았습니다\n${explicit.stdout ?? ""}${explicit.stderr ?? ""}`);
  }

  delete fixtureEntries[0].development_approval;
  writeFileSync(fixturePath, `${fixtureEntries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  const unapproved = spawnSync(process.execPath, [
    join(root, ".agents/harness/scripts/run.mjs"),
    "--index",
    fixturePath,
    "--task",
    "P9-T00"
  ], { cwd: root, encoding: "utf8" });
  const unapprovedOutput = `${unapproved.stdout ?? ""}${unapproved.stderr ?? ""}`;
  if (unapproved.status === 0 || !unapprovedOutput.includes("DEVELOPMENT_APPROVAL")) {
    throw new Error(`승인 기록 없는 task가 거부되지 않았습니다\n${unapprovedOutput}`);
  }
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

console.log("투트랙 딥인터뷰·자율 개발 승인 인계 자체 검사를 통과했습니다");
