import { runMotionRenderBudgetGate } from "../lib/motion-render-budget.ts";
import { resolveRepoRoot } from "../lib/repo.ts";
import { reportViolations } from "../lib/violation.ts";

const violations = await runMotionRenderBudgetGate(resolveRepoRoot());
process.exitCode = reportViolations(violations);
