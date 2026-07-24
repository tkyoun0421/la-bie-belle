import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { loadIndex, repoRootFrom, validateIndex } from "./lib/index.mjs";

const root = repoRootFrom(import.meta.url);
const { entries } = loadIndex(root);
const incomplete = entries.filter((entry) =>
  entry.kind === "task" && ["planned", "in_progress", "blocked", "verification_pending"].includes(entry.status)
);
const errors = validateIndex(entries);
if (errors.length) throw new Error(errors.join("; "));
if (incomplete.some((task) => !task.test_mode || !Array.isArray(task.check_ids) || task.check_ids.length === 0)) {
  throw new Error("실행 계약이 없는 미완료 작업이 있습니다");
}

const fixtureEntries = structuredClone(entries);
const target = fixtureEntries.find((entry) => entry.id === "P0-T01");
target.status = "planned";
target.approval_contract = "dual-approval-v3";
target.product_approval = { by: "user", at: "2026-07-24" };
target.development_approval = { by: "user", at: "2026-07-24", radio_revision: 1, radio_sha256: "a".repeat(64) };
target.radio_ref = "docs/development/P0-T01-radio.md";
delete target.test_mode;
delete target.check_ids;
const fixtureErrors = validateIndex(fixtureEntries);
if (!fixtureErrors.some((error) => error.includes("P0-T01") && error.includes("test_mode"))) {
  throw new Error(`검사기가 누락된 작업 계약을 허용했습니다: ${fixtureErrors.join("; ")}`);
}

const fixtureDir = mkdtempSync(join(tmpdir(), "la-bie-belle-contract-"));
try {
  const fixturePath = join(fixtureDir, "index.jsonl");
  writeFileSync(fixturePath, `${fixtureEntries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  const result = spawnSync(process.execPath, [join(root, ".agents/harness/scripts/run.mjs"), "--index", fixturePath, "--task", "P0-T01"], {
    cwd: root,
    encoding: "utf8"
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.status === 0 || !output.includes("P0-T01") || !output.includes("test_mode")) {
    throw new Error(`실행기가 명시적 선택에서 누락된 계약을 허용했습니다\n${output}`);
  }
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

const schema = JSON.parse(readFileSync(join(root, "docs/phases/index.schema.json"), "utf8"));
if (schema.properties?.check_ids?.minItems !== 1) throw new Error("스키마는 check_ids가 있으면 비어 있지 않도록 요구해야 합니다");
if (!schema.properties?.status?.enum?.includes("proposed")) throw new Error("스키마는 proposed 상태를 지원해야 합니다");
console.log(`작업 계약 자체 검사를 통과했습니다: 미완료 작업 ${incomplete.length}개를 확인했습니다`);
