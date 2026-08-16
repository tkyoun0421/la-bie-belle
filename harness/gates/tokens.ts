import { runTokenParityGate } from "../lib/token-parity.ts";
import { resolveRepoRoot } from "../lib/repo.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runTokenParityGate(resolveRepoRoot()));
