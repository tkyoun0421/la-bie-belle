import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { assertRunnableTask, loadIndex, repoRootFrom, validateIndex } from "./lib/index.mjs";

const root = repoRootFrom(import.meta.url);
const requiredText = new Map([
  ["docs/WORKFLOW.md", ["딥인터뷰 설계 루프", "자율 개발 루프", "다음 task를 자동 선택하지 않는다"]],
  ["AGENTS.md", ["트랙 A: 딥인터뷰 설계", "트랙 B: 자율 개발 루프"]],
  [".agents/skills/la-bie-belle-deep-interview/SKILL.md", ["Run the interview loop", "Do not mark a task `in_progress`"]],
  [".agents/skills/la-bie-belle-harness/SKILL.md", ["Execute autonomously", "Never select the next task automatically"]]
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
const proposed = entries.find((entry) => entry.kind === "task" && entry.status === "proposed");
if (!proposed) throw new Error("딥인터뷰에서 검토할 proposed 작업이 필요합니다");
let proposedRejected = false;
try {
  assertRunnableTask(entries, proposed);
} catch (error) {
  proposedRejected = error.message.includes("proposed") && error.message.includes("실행할 수 없습니다");
}
if (!proposedRejected) throw new Error("proposed 작업이 실행 경계에서 거부되지 않았습니다");

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
  const fixtureEntries = [
    {
      schema_version: 2,
      kind: "task",
      id: "P9-T00",
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
      approved_by: "user",
      approved_at: "2026-07-24"
    }
  ];
  writeFileSync(fixturePath, `${fixtureEntries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  const explicit = spawnSync(process.execPath, [
    join(root, ".agents/harness/scripts/run.mjs"),
    "--index",
    fixturePath,
    "--task",
    "P9-T00"
  ], { cwd: root, encoding: "utf8" });
  if (explicit.status !== 0 || !explicit.stdout.includes("\"status\": \"selected\"")) {
    throw new Error(`승인된 명시 task가 선택되지 않았습니다\n${explicit.stdout ?? ""}${explicit.stderr ?? ""}`);
  }

  delete fixtureEntries[0].approved_by;
  delete fixtureEntries[0].approved_at;
  writeFileSync(fixturePath, `${fixtureEntries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  const unapproved = spawnSync(process.execPath, [
    join(root, ".agents/harness/scripts/run.mjs"),
    "--index",
    fixturePath,
    "--task",
    "P9-T00"
  ], { cwd: root, encoding: "utf8" });
  const unapprovedOutput = `${unapproved.stdout ?? ""}${unapproved.stderr ?? ""}`;
  if (unapproved.status === 0 || !unapprovedOutput.includes("approved_by")) {
    throw new Error(`승인 기록 없는 task가 거부되지 않았습니다\n${unapprovedOutput}`);
  }
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

console.log("투트랙 딥인터뷰·자율 개발 승인 인계 자체 검사를 통과했습니다");
