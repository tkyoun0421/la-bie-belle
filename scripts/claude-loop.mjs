#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, openSync, closeSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtime = join(root, ".claude", "runtime");
const statePath = join(runtime, "loop-state.json");
const lockPath = join(runtime, "supervisor.lock");
const harnessLibUrl = (fileName) => new URL(`../harness/lib/${fileName}`, import.meta.url).href;
const mod = await import(harnessLibUrl("claude-loop-state.ts"));
const { INDEX_PATH, readTextFile } = await import(harnessLibUrl("repo.ts"));
const { parseIndexJsonl } = await import(harnessLibUrl("task-index.ts"));

const args = process.argv.slice(3);
const option = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
const dryRun = args.includes("--dry-run");
const localTimeToday = (value) => { if (!value) return null; if (/^\d{2}:\d{2}$/.test(value)) { const [hour, minute] = value.split(":").map(Number); const date = new Date(); date.setHours(hour, minute, 0, 0); return date; } const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? null : parsed; };
const readInput = async () => { let data = ""; for await (const chunk of process.stdin) data += chunk; try { return JSON.parse(data || "{}"); } catch { return {}; } };
const command = process.argv[2] || "status";

function readQueueSelection() {
  const text = readTextFile(root, INDEX_PATH);
  const entries = text === null ? [] : parseIndexJsonl(text).entries;
  return mod.selectQueueTask(entries);
}

if (command === "record-usage" || command === "record-failure") { const input = await readInput(); const state = mod.readState(statePath); mod.writeState(statePath, command === "record-usage" ? mod.recordUsage(state, input) : mod.recordFailure(state, input)); process.exit(0); }
if (command === "status") { console.log(JSON.stringify(mod.readState(statePath), null, 2)); process.exit(0); }
mkdirSync(runtime, { recursive: true });
if (command === "stop") { const state = mod.readState(statePath); mod.writeState(statePath, { ...state, status: "stopped", updated_at: new Date().toISOString() }); try { unlinkSync(lockPath); } catch {} process.exit(0); }
if (command !== "start") { console.error("unknown claude loop command"); process.exit(1); }
let lock; try { lock = openSync(lockPath, "wx", 0o600); } catch { console.error("supervisor already running"); process.exit(2); }
try {
  const resumeAt = localTimeToday(option("--resume-at"));
  const notBefore = option("--not-before") || "12:00";
  let state = mod.readState(statePath);
  const requestedSession = option("--session-id");
  if (requestedSession) state = { ...state, session_id: requestedSession, task_id: state.task_id, status: "waiting_rate_limit", updated_at: new Date().toISOString() };
  if (!requestedSession && resumeAt && resumeAt.valueOf() > Date.now()) {
    state = { ...state, status: "waiting_rate_limit", next_attempt_at: resumeAt.toISOString(), updated_at: new Date().toISOString() }; mod.writeState(statePath, state); console.log(`waiting until ${resumeAt.toISOString()}`);
    while (Date.now() < resumeAt.valueOf()) await new Promise((resolve) => setTimeout(resolve, Math.min(30_000, resumeAt.valueOf() - Date.now())));
  }
  if (!state.session_id) {
    const selection = readQueueSelection();
    if (selection.kind === "idle") {
      mod.writeState(statePath, { ...state, status: "stopped", updated_at: new Date().toISOString() });
      console.log("planned queue is empty");
      process.exit(0);
    }
    if (dryRun) { console.log(JSON.stringify({ dry_run: true, action: "claude --bg", task_id: selection.taskId, resume_at: resumeAt?.toISOString() || null, not_before: notBefore })); process.exit(0); }
    const prompt = join(root, ".claude", "loop.md"); const output = execFileSync("claude", ["--bg", `Read ${prompt}. Resume the current approved task. Do not plan or design before ${notBefore} local time; after that time planning/design is allowed only within approvals. Record a concise checkpoint before stopping.`], { cwd: root, encoding: "utf8" });
    state = { ...state, session_id: output.trim().split(/\s+/).pop() || null, task_id: selection.taskId, status: "running", updated_at: new Date().toISOString() }; mod.writeState(statePath, state); console.log(state.session_id || "started");
  } else if (resumeAt && resumeAt.valueOf() > Date.now()) {
    state = { ...state, next_attempt_at: resumeAt.toISOString(), updated_at: new Date().toISOString() }; mod.writeState(statePath, state); console.log(`waiting until ${resumeAt.toISOString()}`);
  }
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 30_000));
    const current = mod.readState(statePath);
    if (current.status === "stopped" || current.status === "needs_user") break;
    if (current.status === "waiting_rate_limit" && current.session_id && current.next_attempt_at && Date.parse(current.next_attempt_at) <= Date.now()) {
      try {
        execFileSync("claude", ["respawn", current.session_id], { cwd: root, stdio: "ignore" });
        mod.writeState(statePath, mod.recordRespawnSuccess(current));
      } catch {
        const failed = mod.recordRespawnFailure(current);
        mod.writeState(statePath, failed);
        if (failed.status === "needs_user") break;
      }
    }
  }
} catch { mod.writeState(statePath, { ...mod.readState(statePath), status: "needs_user", last_error_kind: "unknown", updated_at: new Date().toISOString() }); process.exitCode = 2; }
finally { if (lock !== undefined) closeSync(lock); try { unlinkSync(lockPath); } catch {} }
