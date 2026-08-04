import { runHandoffGate } from "../lib/handoff-gate.ts";
import { resolveRepoRoot } from "../lib/repo.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runHandoffGate(resolveRepoRoot(), process.argv[2]));
