import { runDocsCheck } from "../lib/docs-check.ts";
import { resolveRepoRoot } from "../lib/repo.ts";
import { reportViolations } from "../lib/violation.ts";

process.exitCode = reportViolations(runDocsCheck(resolveRepoRoot()));
