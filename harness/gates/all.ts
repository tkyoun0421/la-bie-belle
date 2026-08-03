import { runAllGates } from "../lib/gate-suite.ts";
import { resolveRepoRoot } from "../lib/repo.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runAllGates(resolveRepoRoot()));
