import { runRadioGate } from "../lib/radio-gate.ts";
import { resolveRepoRoot } from "../lib/repo.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runRadioGate(resolveRepoRoot()));
