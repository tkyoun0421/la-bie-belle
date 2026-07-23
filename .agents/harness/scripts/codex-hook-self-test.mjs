import { evaluate, isGitCommit } from "../../../.codex/hooks/pre-tool-use.mjs";

if (!isGitCommit("git commit -m 'test'")) throw new Error("plain git commit must match");
if (!isGitCommit("git -c user.name=test commit -m test")) throw new Error("git option commit must match");
if (isGitCommit("git status")) throw new Error("non-commit command must not match");

const deny = evaluate(process.cwd(), { tool_name: "Bash", tool_input: { command: "git commit -m test" } }, () => ({ status: 1, stderr: "TDD evidence missing" }));
if (deny.hookSpecificOutput?.permissionDecision !== "deny") throw new Error("failed guard must deny a Codex git commit");

const allow = evaluate(process.cwd(), { tool_name: "Bash", tool_input: { command: "git commit -m test" } }, () => ({ status: 0 }));
if (Object.keys(allow).length !== 0) throw new Error("passing guard must allow a Codex git commit");

const doneTaskCommit = evaluate(
  process.cwd(),
  { tool_name: "Bash", tool_input: { command: "HARNESS_TASK_ID=P0-T21 git commit -m test" } },
  (_root, taskId) => taskId === "P0-T21" ? { status: 0 } : { status: 1 }
);
if (Object.keys(doneTaskCommit).length !== 0) throw new Error("task-scoped commit must pass its HARNESS_TASK_ID to the guard");

const tddContext = evaluate(
  process.cwd(),
  { tool_name: "apply_patch", tool_input: {} },
  () => ({ status: 0 }),
  () => ({ id: "P1-T01", test_mode: "tdd" })
);
if (!tddContext.hookSpecificOutput?.additionalContext?.includes("TDD")) {
  throw new Error("TDD edit context must mention TDD");
}

console.log("Codex hook self-test ok");
