import { runIndexGate } from "../lib/index-gate.ts";
import { resolveRepoRoot } from "../lib/repo.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runIndexGate(resolveRepoRoot()));
