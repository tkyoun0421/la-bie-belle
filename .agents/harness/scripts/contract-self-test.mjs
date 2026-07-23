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
if (incomplete.length === 0) throw new Error("expected incomplete task fixtures");
const errors = validateIndex(entries);
if (errors.length) throw new Error(errors.join("; "));
if (incomplete.some((task) => !task.test_mode || !Array.isArray(task.check_ids) || task.check_ids.length === 0)) {
  throw new Error("incomplete task without execution contract");
}

const fixtureEntries = structuredClone(entries);
const target = fixtureEntries.find((entry) => entry.id === "P0-T01");
delete target.test_mode;
delete target.check_ids;
const fixtureErrors = validateIndex(fixtureEntries);
if (!fixtureErrors.some((error) => error.includes("P0-T01") && error.includes("test_mode"))) {
  throw new Error(`validator accepted missing task contract: ${fixtureErrors.join("; ")}`);
}

const fixtureDir = mkdtempSync(join(tmpdir(), "la-bie-belle-contract-"));
try {
  const fixturePath = join(fixtureDir, "index.jsonl");
  writeFileSync(fixturePath, `${fixtureEntries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  for (const args of [["--index", fixturePath, "--task", "P0-T01"], ["--index", fixturePath]]) {
    const result = spawnSync(process.execPath, [join(root, ".agents/harness/scripts/run.mjs"), ...args], {
      cwd: root,
      encoding: "utf8"
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (result.status === 0 || !output.includes("P0-T01") || !output.includes("test_mode")) {
      throw new Error(`runner accepted missing contract for ${args.includes("--task") ? "explicit" : "automatic"} selection\n${output}`);
    }
  }
} finally {
  rmSync(fixtureDir, { recursive: true, force: true });
}

const schema = JSON.parse(readFileSync(join(root, "docs/phases/index.schema.json"), "utf8"));
if (schema.properties?.check_ids?.minItems !== 1) throw new Error("schema must require non-empty check_ids when present");
console.log(`task contract self-test ok: ${incomplete.length} incomplete tasks covered`);
