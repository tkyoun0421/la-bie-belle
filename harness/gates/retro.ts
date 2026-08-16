import { resolveRepoRoot } from "../lib/repo.ts";
import { runRetroGate } from "../lib/retro-gate.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runRetroGate(resolveRepoRoot()));
