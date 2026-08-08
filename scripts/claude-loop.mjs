#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtime = join(root, ".claude", "runtime");
const statePath = join(runtime, "loop-state.json");
const stateLockPath = join(runtime, "loop-state.lock");
const lockPath = join(runtime, "supervisor.lock");

const harnessLibUrl = (fileName) => new URL(`../harness/lib/${fileName}`, import.meta.url).href;
const mod = await import(harnessLibUrl("claude-loop-state.ts"));
const { INDEX_PATH, readTextFile, sha256OfFile } = await import(harnessLibUrl("repo.ts"));
const { parseIndexJsonl } = await import(harnessLibUrl("task-index.ts"));
const { runIndexGate } = await import(harnessLibUrl("index-gate.ts"));
const { checkRadioBindings } = await import(harnessLibUrl("radio-gate.ts"));
const { runHandoffGate } = await import(harnessLibUrl("handoff-gate.ts"));

const args = process.argv.slice(3);
const command = process.argv[2] || "status";
const dryRun = args.includes("--dry-run");
const watch = args.includes("--watch");

function option(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function localTimeToday(value) {
  if (!value) {
    return null;
  }
  if (/^\d{2}:\d{2}$/.test(value)) {
    const [hour, minute] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

async function readInput() {
  let data = "";
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  try {
    return JSON.parse(data || "{}");
  } catch {
    return {};
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readIndexEntries() {
  const text = readTextFile(root, INDEX_PATH);
  return text === null ? [] : parseIndexJsonl(text).entries;
}

function readQueueSelection() {
  return mod.selectQueueTask(readIndexEntries());
}

function reverifyRepositoryForNewSession() {
  const entries = readIndexEntries();
  return [
    ...runIndexGate(root),
    ...checkRadioBindings(entries, (relativePath) => sha256OfFile(root, relativePath)),
    ...runHandoffGate(root),
  ];
}

function computeDryRunPlan() {
  const resumeAt = localTimeToday(option("--resume-at"));
  const notBefore = option("--not-before") || "12:00";
  const requestedSession = option("--session-id");
  const resumeAtIso = resumeAt ? resumeAt.toISOString() : null;

  if (watch) {
    return {
      dry_run: true,
      action: "watch",
      task_id: mod.deriveTaskId(readIndexEntries()),
      session_id: null,
      resume_at: resumeAtIso,
      not_before: notBefore,
    };
  }
  if (requestedSession) {
    return {
      dry_run: true,
      action: "respawn",
      task_id: null,
      session_id: requestedSession,
      resume_at: resumeAtIso,
      not_before: notBefore,
    };
  }
  const selection = readQueueSelection();
  return {
    dry_run: true,
    action: selection.kind === "idle" ? "none" : "claude --bg",
    task_id: selection.kind === "idle" ? null : selection.taskId,
    session_id: null,
    resume_at: resumeAtIso,
    not_before: notBefore,
  };
}

async function withStateLock(run) {
  const maxAttempts = 25;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let fd;
    try {
      fd = openSync(stateLockPath, "wx", 0o600);
    } catch {
      await sleep(20);
      continue;
    }
    try {
      return { ok: true, value: run() };
    } finally {
      closeSync(fd);
      try {
        unlinkSync(stateLockPath);
      } catch {}
    }
  }
  return { ok: false, value: undefined };
}

async function updateState(mutate) {
  const result = await withStateLock(() => {
    const current = mod.readState(statePath);
    const next = mutate(current);
    mod.writeState(statePath, next);
    return next;
  });
  return result.ok ? result.value : mod.readState(statePath);
}

function acquireSupervisorLock() {
  try {
    const fd = openSync(lockPath, "wx", 0o600);
    writeSync(fd, String(process.pid));
    return fd;
  } catch {
    return undefined;
  }
}

function releaseSupervisorLock(fd) {
  if (fd !== undefined) {
    try {
      closeSync(fd);
    } catch {}
  }
  let owner = null;
  try {
    owner = readFileSync(lockPath, "utf8").trim();
  } catch {}
  if (owner === String(process.pid)) {
    try {
      unlinkSync(lockPath);
    } catch {}
  }
}

async function runStart() {
  const lock = acquireSupervisorLock();
  if (lock === undefined) {
    console.error("supervisor already running");
    return 2;
  }

  try {
    const resumeAt = localTimeToday(option("--resume-at"));
    const notBefore = option("--not-before") || "12:00";
    const requestedSession = option("--session-id");
    let state = mod.readState(statePath);

    if (requestedSession) {
      state = await updateState((current) => ({
        ...current,
        session_id: requestedSession,
        status: "waiting_rate_limit",
        updated_at: new Date().toISOString(),
      }));
    } else if (state.status === "needs_user" && state.last_error_kind !== null) {
      console.log(
        `checkpoint status is needs_user (last_error_kind: ${state.last_error_kind}). Run 'pnpm claude:loop status' for the reason, resolve it manually, then restart with 'pnpm claude:loop start --session-id <id>' if you want to keep the same session.`,
      );
      return 2;
    } else if (resumeAt && resumeAt.valueOf() > Date.now()) {
      state = await updateState((current) => ({
        ...current,
        status: "waiting_rate_limit",
        next_attempt_at: resumeAt.toISOString(),
        updated_at: new Date().toISOString(),
      }));
      console.log(`waiting until ${resumeAt.toISOString()}`);
      while (Date.now() < resumeAt.valueOf()) {
        await sleep(Math.min(30_000, resumeAt.valueOf() - Date.now()));
      }
    }

    if (watch) {
      const derivedTaskId = mod.deriveTaskId(readIndexEntries());
      state = await updateState((current) => {
        const status =
          current.status === "waiting_rate_limit" || current.status === "armed"
            ? current.status
            : "running";
        return {
          ...current,
          status,
          task_id: current.task_id === null ? derivedTaskId : current.task_id,
          updated_at: new Date().toISOString(),
        };
      });
      console.log("loop-mode watch active");
    } else if (!state.session_id || state.status === "stopped") {
      const violations = reverifyRepositoryForNewSession();
      if (!mod.isSafeToInvokeClaude(violations)) {
        console.error(
          `repository reverification blocked the new session:\n${violations
            .map((violation) => `- [${violation.gate}] ${violation.message}`)
            .join("\n")}`,
        );
        await updateState((current) => ({
          ...current,
          status: "needs_user",
          updated_at: new Date().toISOString(),
        }));
        return 2;
      }
      const selection = readQueueSelection();
      if (selection.kind === "idle") {
        await updateState((current) => ({
          ...current,
          status: "stopped",
          updated_at: new Date().toISOString(),
        }));
        console.log("planned queue is empty");
        return 0;
      }
      const prompt = join(root, ".claude", "loop.md");
      const output = execFileSync(
        "claude",
        [
          "--bg",
          `Read ${prompt}. Resume the current approved task. Do not plan or design before ${notBefore} local time; after that time planning/design is allowed only within approvals. Record a concise checkpoint before stopping.`,
        ],
        { cwd: root, encoding: "utf8" },
      );
      state = await updateState((current) => ({
        ...current,
        session_id: output.trim().split(/\s+/).pop() || null,
        task_id: selection.taskId,
        status: "running",
        updated_at: new Date().toISOString(),
      }));
      console.log(state.session_id || "started");
    } else if (resumeAt && resumeAt.valueOf() > Date.now()) {
      state = await updateState((current) => ({
        ...current,
        next_attempt_at: resumeAt.toISOString(),
        updated_at: new Date().toISOString(),
      }));
      console.log(`waiting until ${resumeAt.toISOString()}`);
    }

    while (true) {
      await sleep(3_000);
      const current = mod.readState(statePath);
      if (current.status === "stopped" || current.status === "needs_user") {
        break;
      }
      if (
        current.status === "waiting_rate_limit" &&
        current.session_id &&
        current.next_attempt_at &&
        Date.parse(current.next_attempt_at) <= Date.now()
      ) {
        try {
          execFileSync("claude", ["respawn", current.session_id], { cwd: root, stdio: "ignore" });
          writeFileSync(
            join(runtime, "unattended-resume.json"),
            `${JSON.stringify({ session_id: current.session_id, resumed_at: new Date().toISOString() })}\n`,
            { mode: 0o600 },
          );
          await updateState((latest) => mod.recordRespawnSuccess(latest));
        } catch {
          const failed = await updateState((latest) => mod.recordRespawnFailure(latest));
          if (failed.status === "needs_user") {
            break;
          }
        }
      }
    }
    return 0;
  } catch {
    await updateState((current) => ({
      ...current,
      status: "needs_user",
      last_error_kind: "unknown",
      updated_at: new Date().toISOString(),
    }));
    return 2;
  } finally {
    releaseSupervisorLock(lock);
  }
}

async function main() {
  if (command === "start" && dryRun) {
    console.log(JSON.stringify(computeDryRunPlan()));
    return 0;
  }

  mkdirSync(runtime, { recursive: true });

  if (command === "record-usage" || command === "record-failure") {
    const input = await readInput();
    await updateState((current) => {
      if (command === "record-usage") {
        return mod.recordUsage(current, input);
      }
      const failed = mod.recordFailure(current, input);
      if (failed.task_id !== null) {
        return failed;
      }
      const derivedTaskId = mod.deriveTaskId(readIndexEntries());
      return derivedTaskId === null ? failed : { ...failed, task_id: derivedTaskId };
    });
    return 0;
  }

  if (command === "status") {
    console.log(JSON.stringify(mod.readState(statePath), null, 2));
    return 0;
  }

  if (command === "stop") {
    await updateState((current) => ({
      ...current,
      status: "stopped",
      updated_at: new Date().toISOString(),
    }));
    return 0;
  }

  if (command !== "start") {
    console.error("unknown claude loop command");
    return 1;
  }

  return runStart();
}

process.exitCode = await main();
