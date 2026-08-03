import { resolveRepoRoot } from "../lib/repo.ts";
import { runScopeGate } from "../lib/scope-gate.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runScopeGate(resolveRepoRoot()));
