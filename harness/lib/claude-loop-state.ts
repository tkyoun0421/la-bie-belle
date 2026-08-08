import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  EXECUTABLE_STATUSES,
  isTask,
  readObjectField,
  readStringField,
  recordId,
  recordStatus,
} from "./task-index.ts";
import type { IndexEntry, IndexRecord } from "./task-index.ts";

export const USAGE_THRESHOLD = 95;
export const MAX_RETRY_ATTEMPTS = 6;
export const EPISODE_WINDOW_MS = 60 * 60_000;

export const ERROR_TYPES = [
  "rate_limit",
  "overloaded",
  "authentication_failed",
  "oauth_org_not_allowed",
  "billing_error",
  "invalid_request",
  "model_not_found",
  "server_error",
  "max_output_tokens",
  "unknown",
] as const;
export type ErrorType = (typeof ERROR_TYPES)[number];

const BOUNDED_BACKOFF_TYPES: ReadonlySet<ErrorType> = new Set(["rate_limit", "overloaded"]);

export type LoopStatus =
  | "starting"
  | "running"
  | "armed"
  | "waiting_rate_limit"
  | "needs_user"
  | "stopped";
const STATUSES: readonly LoopStatus[] = [
  "starting",
  "running",
  "armed",
  "waiting_rate_limit",
  "needs_user",
  "stopped",
];

export type UsageWindow = { used_percentage: number; resets_at: string | null };
export type LoopState = {
  schema_version: 1;
  session_id: string | null;
  task_id: string | null;
  status: LoopStatus;
  attempt: number;
  next_attempt_at: string | null;
  last_failure_at: string | null;
  last_error_kind: string | null;
  usage: {
    five_hour: UsageWindow;
    seven_day: UsageWindow;
    armed_window: "five_hour" | "seven_day" | null;
  };
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const blankWindow = (): UsageWindow => ({ used_percentage: 0, resets_at: null });

export function initialState(): LoopState {
  return {
    schema_version: 1,
    session_id: null,
    task_id: null,
    status: "stopped",
    attempt: 0,
    next_attempt_at: null,
    last_failure_at: null,
    last_error_kind: null,
    usage: { five_hour: blankWindow(), seven_day: blankWindow(), armed_window: null },
    updated_at: new Date(0).toISOString(),
  };
}

export function normalizeErrorType(value: unknown): ErrorType {
  return typeof value === "string" && (ERROR_TYPES as readonly string[]).includes(value)
    ? (value as ErrorType)
    : "unknown";
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

function normalizeResetsAt(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return null;
}

function windowOf(value: unknown): UsageWindow {
  const record = isRecord(value) ? value : {};
  return {
    used_percentage: numberOrZero(record.used_percentage),
    resets_at: normalizeResetsAt(record.resets_at),
  };
}

export function recordUsage(state: LoopState, input: unknown, now = new Date()): LoopState {
  const value = isRecord(input) ? input : {};
  if (!isRecord(value.rate_limits)) {
    return state;
  }
  const windows = value.rate_limits;
  const five = windowOf(windows.five_hour);
  const seven = windowOf(windows.seven_day);
  const armed_window =
    five.used_percentage >= USAGE_THRESHOLD
      ? "five_hour"
      : seven.used_percentage >= USAGE_THRESHOLD
        ? "seven_day"
        : null;
  return {
    ...state,
    status: armed_window ? "armed" : state.status === "armed" ? "running" : state.status,
    usage: { five_hour: five, seven_day: seven, armed_window },
    updated_at: now.toISOString(),
  };
}

function resolveArmedResetAt(state: LoopState): number | null {
  const window =
    state.usage.armed_window === "five_hour"
      ? state.usage.five_hour
      : state.usage.armed_window === "seven_day"
        ? state.usage.seven_day
        : null;
  const parsed = window?.resets_at ? Date.parse(window.resets_at) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function computeBackoffDueAt(attempt: number, now: Date, resetAt: number | null): string {
  const minutes = Math.min(30, 5 * 2 ** Math.min(Math.max(attempt - 1, 0), 3));
  const backoffAt = now.getTime() + minutes * 60_000;
  const dueAt = resetAt !== null ? Math.max(backoffAt, resetAt) : backoffAt;
  return new Date(dueAt).toISOString();
}

function isOutstandingDuplicate(
  state: LoopState,
  sessionId: string | null,
  errorType: ErrorType,
): boolean {
  return (
    sessionId !== null &&
    sessionId === state.session_id &&
    state.last_error_kind === errorType &&
    (state.status === "waiting_rate_limit" || state.status === "needs_user")
  );
}

function nextEpisodeAttempt(state: LoopState, now: Date): number {
  const previousFailureAt =
    state.last_failure_at === null ? Number.NaN : Date.parse(state.last_failure_at);
  const withinEpisode =
    Number.isFinite(previousFailureAt) && now.getTime() - previousFailureAt < EPISODE_WINDOW_MS;
  return (withinEpisode ? state.attempt : 0) + 1;
}

export function recordFailure(state: LoopState, input: unknown, now = new Date()): LoopState {
  const value = isRecord(input) ? input : {};
  const sessionId =
    typeof value.session_id === "string" ? value.session_id.slice(0, 128) : state.session_id;
  const errorType = normalizeErrorType(value.error_type);

  if (isOutstandingDuplicate(state, sessionId, errorType)) {
    return state;
  }

  if (!BOUNDED_BACKOFF_TYPES.has(errorType)) {
    return {
      ...state,
      session_id: sessionId,
      status: "needs_user",
      last_failure_at: now.toISOString(),
      last_error_kind: errorType,
      updated_at: now.toISOString(),
    };
  }

  const attempt = nextEpisodeAttempt(state, now);
  if (attempt > MAX_RETRY_ATTEMPTS) {
    return {
      ...state,
      session_id: sessionId,
      status: "needs_user",
      attempt,
      last_failure_at: now.toISOString(),
      last_error_kind: errorType,
      updated_at: now.toISOString(),
    };
  }

  const resetAt = errorType === "rate_limit" ? resolveArmedResetAt(state) : null;
  return {
    ...state,
    session_id: sessionId,
    status: "waiting_rate_limit",
    attempt,
    last_failure_at: now.toISOString(),
    last_error_kind: errorType,
    next_attempt_at: computeBackoffDueAt(attempt, now, resetAt),
    updated_at: now.toISOString(),
  };
}

export function recordRespawnFailure(state: LoopState, now = new Date()): LoopState {
  const attempt = state.attempt + 1;
  if (attempt > MAX_RETRY_ATTEMPTS) {
    return { ...state, status: "needs_user", attempt, updated_at: now.toISOString() };
  }
  const resetAt = state.last_error_kind === "rate_limit" ? resolveArmedResetAt(state) : null;
  return {
    ...state,
    status: "waiting_rate_limit",
    attempt,
    next_attempt_at: computeBackoffDueAt(attempt, now, resetAt),
    updated_at: now.toISOString(),
  };
}

export function recordRespawnSuccess(state: LoopState, now = new Date()): LoopState {
  return { ...state, status: "running", next_attempt_at: null, updated_at: now.toISOString() };
}

export function sanitizeState(value: unknown): LoopState {
  const v = isRecord(value) ? value : {};
  const base = initialState();
  const usage = isRecord(v.usage) ? v.usage : {};
  const armedWindow = usage.armed_window;
  return {
    ...base,
    session_id: typeof v.session_id === "string" ? v.session_id.slice(0, 128) : null,
    task_id: typeof v.task_id === "string" ? v.task_id.slice(0, 128) : null,
    status:
      typeof v.status === "string" && (STATUSES as readonly string[]).includes(v.status)
        ? (v.status as LoopStatus)
        : "needs_user",
    attempt: typeof v.attempt === "number" ? Math.max(0, Math.floor(v.attempt)) : 0,
    next_attempt_at: typeof v.next_attempt_at === "string" ? v.next_attempt_at.slice(0, 64) : null,
    last_failure_at: typeof v.last_failure_at === "string" ? v.last_failure_at.slice(0, 64) : null,
    last_error_kind: typeof v.last_error_kind === "string" ? normalizeErrorType(v.last_error_kind) : null,
    usage: {
      five_hour: windowOf(usage.five_hour),
      seven_day: windowOf(usage.seven_day),
      armed_window: armedWindow === "five_hour" || armedWindow === "seven_day" ? armedWindow : null,
    },
    updated_at: typeof v.updated_at === "string" ? v.updated_at.slice(0, 64) : base.updated_at,
  };
}

export function readState(path: string): LoopState {
  try {
    return sanitizeState(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return initialState();
  }
}

export function writeState(path: string, state: LoopState): void {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(sanitizeState(state), null, 2)}\n`, { mode: 0o600 });
  renameSync(temp, path);
}

export type QueueSelection =
  | { readonly kind: "resume"; readonly taskId: string }
  | { readonly kind: "next"; readonly taskId: string }
  | { readonly kind: "idle" };

function isApprovedForExecution(record: IndexRecord): boolean {
  if (readStringField(record, "approval_contract") !== "dual-approval-v3") {
    return false;
  }
  return (
    readObjectField(record, "product_approval") !== null &&
    readObjectField(record, "development_approval") !== null &&
    readStringField(record, "radio_ref") !== null
  );
}

function dependenciesSatisfied(record: IndexRecord, statusById: ReadonlyMap<string, string>): boolean {
  const dependsOn = record["depends_on"];
  if (!Array.isArray(dependsOn)) {
    return true;
  }
  return dependsOn.every(
    (dependency) => typeof dependency === "string" && statusById.get(dependency) === "done",
  );
}

export function selectQueueTask(entries: readonly IndexEntry[]): QueueSelection {
  const tasks = entries.filter((entry) => isTask(entry.record));
  const inProgress = tasks.find((entry) => recordStatus(entry.record) === "in_progress");
  if (inProgress !== undefined) {
    return { kind: "resume", taskId: recordId(inProgress.record) };
  }
  const statusById = new Map(tasks.map((entry) => [recordId(entry.record), recordStatus(entry.record)]));
  const next = tasks.find(
    (entry) =>
      EXECUTABLE_STATUSES.includes(recordStatus(entry.record)) &&
      recordStatus(entry.record) === "planned" &&
      isApprovedForExecution(entry.record) &&
      dependenciesSatisfied(entry.record, statusById),
  );
  return next === undefined ? { kind: "idle" } : { kind: "next", taskId: recordId(next.record) };
}

export type SafetyViolation = { readonly gate: string; readonly message: string };

export function isSafeToInvokeClaude(violations: readonly SafetyViolation[]): boolean {
  return violations.length === 0;
}
