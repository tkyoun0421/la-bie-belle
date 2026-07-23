import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { loadIndex, repoRootFrom } from "./lib/index.mjs";

const root = repoRootFrom(import.meta.url);
const rubric = JSON.parse(readFileSync(join(root, ".agents/harness/readiness-rubric.v1.json"), "utf8"));
const exists = (path) => existsSync(join(root, path));
const packageJson = exists("package.json") ? JSON.parse(readFileSync(join(root, "package.json"), "utf8")) : {};
const { entries } = loadIndex(root);
const tasks = entries.filter((entry) => entry.kind === "task");
const checks = JSON.parse(readFileSync(join(root, ".agents/harness/checks.json"), "utf8"));
const harnessConfig = JSON.parse(readFileSync(join(root, ".agents/harness/config.json"), "utf8"));
const runnerSource = [
  ".agents/harness/scripts/run.mjs",
  ".agents/harness/scripts/lib/orchestrator.mjs"
].filter(exists).map((path) => readFileSync(join(root, path), "utf8")).join("\n");
const hasCheck = (id) => Array.isArray(checks[id]) && checks[id].length > 0;
const facts = {
  "AGENTS.md": exists("AGENTS.md"), "README.md": exists("README.md"), "docs/DOMAIN.md": exists("docs/DOMAIN.md"), "docs/README.md": exists("docs/README.md"),
  "phase index": exists("docs/phases/index.jsonl"), "task runner": exists(".agents/harness/scripts/run.mjs"), "tdd skill": exists(".agents/skills/tdd-guard/SKILL.md"), "check registry": Object.keys(checks).length > 0,
  "task verifier": exists(".agents/harness/scripts/verify-task.mjs"), "pre-commit guard": exists(".agents/harness/scripts/pre-commit.mjs"), "self-test": exists(".agents/harness/scripts/self-test.mjs"), "CI workflow": exists(".github/workflows/ci.yml"),
  "architecture document": exists("docs/ARCHITECTURE.md"), "domain boundaries": exists("docs/DOMAIN.md"), "ADR directory": exists("docs/adr"),
  "worktree runner": /worktree",\s*"add"/.test(runnerSource) && /cherry-pick/.test(runnerSource) && hasCheck("runner-lifecycle"),
  "attempt limit": Number(harnessConfig.max_attempts) === 3 && /max_attempts/.test(runnerSource) && hasCheck("runner-blocked"),
  "run evidence": exists(".agents/runs"),
  "package manifest": exists("package.json"), "lockfile": exists("pnpm-lock.yaml") || exists("package-lock.json"), "declared scripts": Object.keys(packageJson.scripts ?? {}).length > 0,
  "commit message guard": exists(".githooks/commit-msg"), "no deploy runner": !/vercel|git\s+push/i.test(runnerSource), "spec references": tasks.length > 0 && tasks.every((task) => Array.isArray(task.spec_refs) && task.spec_refs.length > 0)
};
const categories = rubric.categories.map((category) => {
  const evidence = category.criteria.map((criterion) => ({ criterion, passed: Boolean(facts[criterion]) }));
  const passed = evidence.filter((item) => item.passed).length;
  const score = Math.round((passed / evidence.length) * category.weight * 100) / 100;
  return { ...category, score, max_score: category.weight, evidence };
});
const total = Math.round(categories.reduce((sum, category) => sum + category.score, 0) * 100) / 100;
const proposalCatalog = [
  ["CI workflow", "Add a CI workflow invoking the same harness checks", 5, 5, 2],
  ["lockfile", "Add a committed dependency lockfile", 4, 5, 2],
  ["tdd skill", "Document and enforce the repository TDD workflow", 4, 5, 2],
  ["spec references", "Populate test_mode and check_ids for every task", 4, 5, 3]
];
const proposals = proposalCatalog.filter(([criterion]) => !facts[criterion]).map(([criterion, title, impact, confidence, cost]) => ({ criterion, title, impact, confidence, cost, roi: impact * confidence / cost }));
proposals.sort((a, b) => b.roi - a.roi);
let commit = "unknown";
try { commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(); } catch {}
const report = { rubric_version: rubric.version, evaluated_commit: commit, evaluated_at: new Date().toISOString(), total_score: total, categories, proposals, pending_manual_checks: [], facts };
if (process.argv.includes("--check-runner")) {
  if (!facts["worktree runner"] || !facts["attempt limit"]) throw new Error("readiness runner capability evidence failed");
  console.log(JSON.stringify({ worktree_runner: facts["worktree runner"], attempt_limit: facts["attempt limit"] }, null, 2));
  process.exit(0);
}
const outDir = join(root, ".agents/reports/ai-readiness");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
const historyPath = join(outDir, "history.json");
const history = existsSync(historyPath) ? JSON.parse(readFileSync(historyPath, "utf8")) : [];
history.push({ rubric_version: report.rubric_version, evaluated_commit: report.evaluated_commit, evaluated_at: report.evaluated_at, total_score: report.total_score });
writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
