import { runBundleBudgetGate } from "../lib/bundle-budget.ts";
import { resolveRepoRoot } from "../lib/repo.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runBundleBudgetGate(resolveRepoRoot()));
