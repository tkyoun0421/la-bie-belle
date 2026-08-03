import { resolveRepoRoot } from "../lib/repo.ts";
import { runTddGate } from "../lib/tdd-gate.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runTddGate(resolveRepoRoot()));
