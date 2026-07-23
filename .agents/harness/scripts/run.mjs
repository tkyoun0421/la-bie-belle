import { spawn } from "node:child_process";
import { loadIndex, repoRootFrom, selectNext, validateIndex } from "./lib/index.mjs";

const root = repoRootFrom(import.meta.url);
const args = process.argv.slice(2);
const { entries } = loadIndex(root);
const errors = validateIndex(entries);
if (errors.length) throw new Error(errors.join("; "));
const task = args.includes("--task") ? entries.find((entry) => entry.id === args[args.indexOf("--task") + 1]) : selectNext(entries);
if (!task) { console.log(JSON.stringify({ status: "idle", reason: "no runnable task" })); process.exit(0); }
console.log(JSON.stringify({ status: "selected", task_id: task.id, title: task.title, test_mode: task.test_mode ?? "unset", check_ids: task.check_ids ?? [] }, null, 2));
if (!args.includes("--execute")) process.exit(0);
const prompt = `Implement task ${task.id}: ${task.title}. Read AGENTS.md, the phase document, and all spec_refs. Follow test_mode=${task.test_mode ?? "unset"}; use the repository tdd-guard skill when applicable. Do not push, deploy, or change unrelated tasks.`;
const child = spawn("codex", ["exec", "-C", root, "--sandbox", "workspace-write", "--ask-for-approval", "never", prompt], { cwd: root, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
