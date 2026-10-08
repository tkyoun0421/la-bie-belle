import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

function dbContainerName(): string {
  const result = spawnSync(
    "docker",
    ["ps", "--filter", "name=supabase_db", "--format", "{{.Names}}"],
    { encoding: "utf8" },
  );
  const name = result.stdout.trim().split("\n")[0];
  if (!name) {
    throw new Error(
      "supabase_db 컨테이너를 못 찾았다. 로컬 Supabase가 떠 있는지 확인해라.",
    );
  }
  return name;
}

export function execSql(sql: string, vars: Record<string, string> = {}): void {
  const container = dbContainerName();

  const args = [
    "exec",
    "-i",
    container,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
  ];
  for (const [key, value] of Object.entries(vars)) {
    args.push("-v", `${key}=${value}`);
  }

  execFileSync("docker", args, { input: sql, encoding: "utf8" });
}

export function approveProfile(
  userId: string,
  approvedAt: string = new Date().toISOString(),
): void {
  execSql(
    "update public.profiles set approved_at = :'approved_at' where user_id = :'user_id';\n",
    { user_id: userId, approved_at: approvedAt },
  );
}

export function backdateDeadline(scheduleId: string, pastDate: string): void {
  execSql(
    "update public.schedules set application_deadline = :'past_date' where id = :'schedule_id';\n",
    { schedule_id: scheduleId, past_date: pastDate },
  );
}

export function backdateLeftAt(userId: string, pastIso: string): void {
  execSql(
    "update public.profiles set left_at = :'left_at' where user_id = :'user_id';\n",
    { user_id: userId, left_at: pastIso },
  );
}

export type SeededWageRate = {
  date: string;
  amount: number;
  followsDefault: boolean;
};

export function seedWageHistory(
  profileId: string,
  rows: readonly SeededWageRate[],
): void {
  for (const row of rows) {
    execSql(
      "insert into public.wage_rates (profile_id, effective_date, amount, follows_default)\n" +
        `values (:'profile_id', :'effective_date', :'amount', ${row.followsDefault ? "true" : "false"})\n` +
        "on conflict (profile_id, effective_date) do update\n" +
        "set amount = excluded.amount, follows_default = excluded.follows_default;\n",
      {
        profile_id: profileId,
        effective_date: row.date,
        amount: String(row.amount),
      },
    );
  }
}

const MONTH_TAKEN = new Set(["already_exists", "already_open"]);
const FRESH_MONTH_ATTEMPTS = 7;

function randomMonthOffset(): number {
  return 24 + Math.floor(Math.random() * 90000);
}

function isMonthTaken(error: unknown): boolean {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && MONTH_TAKEN.has(message);
}

export async function withFreshMonth<T>(
  seed: (monthsFromNow: number) => Promise<T>,
): Promise<T> {
  let taken: unknown;

  for (let attempt = 0; attempt < FRESH_MONTH_ATTEMPTS; attempt += 1) {
    try {
      return await seed(randomMonthOffset());
    } catch (error) {
      if (!isMonthTaken(error)) {
        throw error;
      }
      taken = error;
    }
  }

  throw taken;
}

export type ApprovedUser = SignedInUser & { approvedAt: string };

export async function createApprovedUser(): Promise<ApprovedUser> {
  const user = await createSignedInUser();
  const approvedAt = new Date().toISOString();

  approveProfile(user.userId, approvedAt);

  return { ...user, approvedAt };
}

export type AdminUser = SignedInUser & { approvedAt: string };

export async function createAdminUser(): Promise<AdminUser> {
  const user = await createApprovedUser();

  execSql(
    "update public.profiles set role = 'admin' where user_id = :'user_id';\n",
    { user_id: user.userId },
  );

  return user;
}

export function queryColumn(
  sql: string,
  vars: Record<string, string> = {},
): string[] {
  const container = dbContainerName();

  const args = [
    "exec",
    "-i",
    container,
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-t",
    "-A",
    "-v",
    "ON_ERROR_STOP=1",
  ];
  for (const [key, value] of Object.entries(vars)) {
    args.push("-v", `${key}=${value}`);
  }

  const output = execFileSync("docker", args, { input: sql, encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export async function withOnlyAdmin<T>(
  adminProfileId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const otherAdminIds = queryColumn(
    "select id from public.profiles where role = 'admin' and left_at is null and blocked_at is null and id <> :'admin_id';\n",
    { admin_id: adminProfileId },
  );

  if (otherAdminIds.length > 0) {
    const idList = otherAdminIds.map((id) => `'${id}'`).join(",");
    execSql(
      `update public.profiles set left_at = now() where id = any(array[${idList}]::uuid[]);\n`,
    );
  }

  try {
    return await fn();
  } finally {
    if (otherAdminIds.length > 0) {
      const idList = otherAdminIds.map((id) => `'${id}'`).join(",");
      execSql(
        `update public.profiles set left_at = null where id = any(array[${idList}]::uuid[]);\n`,
      );
    }
  }
}

export type BlockedUser = SignedInUser & {
  approvedAt: string;
  blockedAt: string;
};

export async function createBlockedUser(): Promise<BlockedUser> {
  const user = await createApprovedUser();
  const blockedAt = new Date().toISOString();

  execSql(
    "update public.profiles set blocked_at = :'blocked_at' where user_id = :'user_id';\n",
    { user_id: user.userId, blocked_at: blockedAt },
  );

  return { ...user, blockedAt };
}

export type RejectedUser = SignedInUser & { rejectedAt: string };

export async function createRejectedUser(): Promise<RejectedUser> {
  const user = await createSignedInUser();
  const rejectedAt = new Date().toISOString();

  execSql(
    "update public.profiles set rejected_at = :'rejected_at' where user_id = :'user_id';\n",
    { user_id: user.userId, rejected_at: rejectedAt },
  );

  return { ...user, rejectedAt };
}

let submittedUserSequence = 0;

export type SubmittedUser = SignedInUser & { submittedAt: string };

export async function createSubmittedUser(): Promise<SubmittedUser> {
  const user = await createSignedInUser();
  submittedUserSequence += 1;
  const phone = `010-0000-${String(submittedUserSequence % 10000).padStart(4, "0")}`;

  const { error } = await user.client.rpc("submit_profile", {
    display_name: "제출자",
    phone,
    birth_date: "1990-01-01",
    gender: "female",
  });
  if (error) {
    throw error;
  }

  const { data, error: profileError } = await user.client
    .from("profiles")
    .select("submitted_at")
    .eq("id", user.profileId)
    .single<{ submitted_at: string }>();
  if (profileError || !data) {
    throw profileError ?? new Error("제출된 프로필을 못 찾았다");
  }

  return { ...user, submittedAt: data.submitted_at };
}

export type LeftUser = SignedInUser & {
  approvedAt: string;
  leftAt: string;
};

export async function createLeftUser(): Promise<LeftUser> {
  const user = await createApprovedUser();
  const leftAt = new Date().toISOString();

  execSql(
    "update public.profiles set left_at = :'left_at' where user_id = :'user_id';\n",
    { user_id: user.userId, left_at: leftAt },
  );

  return { ...user, leftAt };
}

export function kstInstant(workDate: string, time: string): string {
  return `${workDate}T${time}+09:00`;
}

function kstParts(date: Date): { workDate: string; time: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    parts[part.type] = part.value;
  }
  return {
    workDate: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

function kstTodayUtcMidnight(): Date {
  return new Date(`${kstParts(new Date()).workDate}T00:00:00Z`);
}

function toDateString(utcMidnight: Date): string {
  return [
    String(utcMidnight.getUTCFullYear()).padStart(4, "0"),
    String(utcMidnight.getUTCMonth() + 1).padStart(2, "0"),
    String(utcMidnight.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function kstDate(daysFromToday: number = 0): string {
  const day = kstTodayUtcMidnight();
  day.setUTCDate(day.getUTCDate() + daysFromToday);
  return toDateString(day);
}

export function kstMonthStart(monthsFromNow: number): string {
  const day = kstTodayUtcMidnight();
  day.setUTCDate(1);
  day.setUTCMonth(day.getUTCMonth() + monthsFromNow);
  return toDateString(day);
}

export function kstMonthEnd(monthsFromNow: number): string {
  const day = kstTodayUtcMidnight();
  day.setUTCDate(1);
  day.setUTCMonth(day.getUTCMonth() + monthsFromNow + 1);
  day.setUTCDate(0);
  return toDateString(day);
}

export function seedSlot(dayId: string): string {
  const id = randomUUID();
  execSql(
    "insert into public.slots (id, day_id, positions) values (:'id', :'day_id', array['안내']);\n",
    { id, day_id: dayId },
  );
  return id;
}

export function seedAssignment(
  dayId: string,
  profileId: string,
  kind: "regular" | "training" = "training",
  slotId: string | null = null,
  position: string = "안내",
): string {
  const id = randomUUID();
  const seatId =
    kind === "regular" && slotId === null ? seedSlot(dayId) : slotId;
  const slotSql = seatId === null ? "null" : `'${seatId}'`;
  execSql(
    `insert into public.assignments (id, day_id, slot_id, position, profile_id, kind) values (:'id', :'day_id', ${slotSql}, :'position', :'profile_id', :'kind');\n`,
    {
      id,
      day_id: dayId,
      profile_id: profileId,
      kind,
      position,
    },
  );
  return id;
}

export function seedPastSchedule(monthStart: string, createdBy: string): void {
  execSql(
    "insert into public.schedules (month, created_by) values (:'month', :'created_by')\n" +
      "on conflict (month) do nothing;\n",
    { month: monthStart, created_by: createdBy },
  );
}

export function seedPastDay(
  workDate: string,
  monthStart: string,
  startsAt: string,
  endsAt: string,
  openedBy: string,
): void {
  execSql(
    "delete from public.days where work_date = :'work_date';\n" +
      "insert into public.days (schedule_id, work_date, starts_at, ends_at, opened_by)\n" +
      "select id, :'work_date', :'starts_at', :'ends_at', :'opened_by'\n" +
      "from public.schedules where month = :'month';\n",
    {
      work_date: workDate,
      starts_at: startsAt,
      ends_at: endsAt,
      month: monthStart,
      opened_by: openedBy,
    },
  );
}

export function seedCheckIn(
  dayId: string,
  profileId: string,
  checkedAt: string,
): void {
  execSql(
    "insert into public.check_ins (day_id, profile_id, checked_at, reported_at, received_at, method)\n" +
      "values (:'day_id', :'profile_id', :'checked_at', :'checked_at', :'checked_at', 'qr')\n" +
      "on conflict (day_id, profile_id) do nothing;\n",
    { day_id: dayId, profile_id: profileId, checked_at: checkedAt },
  );
}

export function seedHoliday(
  holidayDate: string,
  source: "api" | "manual",
  name: string | null = null,
): void {
  execSql(
    "insert into public.holidays (holiday_date, source, name)\n" +
      "values (:'holiday_date', :'source', :'name')\n" +
      "on conflict (holiday_date, source) do update set name = excluded.name;\n",
    { holiday_date: holidayDate, source, name: name ?? "" },
  );
}

export function seedSlotOfPosition(dayId: string, position: string): string {
  const id = randomUUID();
  execSql(
    "insert into public.slots (id, day_id, positions) values (:'id', :'day_id', array[:'position']);\n",
    { id, day_id: dayId, position },
  );
  return id;
}

export function seedJointSlot(
  dayId: string,
  positions: [string, string],
): string {
  const id = randomUUID();
  execSql(
    "insert into public.slots (id, day_id, positions) values (:'id', :'day_id', array[:'position_a', :'position_b']);\n",
    { id, day_id: dayId, position_a: positions[0], position_b: positions[1] },
  );
  return id;
}

export function seedExcuse(
  dayId: string,
  profileId: string,
  decision: "approved" | "rejected" | null = "approved",
): void {
  const decisionSql = decision === null ? "null" : ":'decision'";
  const decidedAtSql = decision === null ? "null" : "now()";
  const vars: Record<string, string> = {
    day_id: dayId,
    profile_id: profileId,
  };

  if (decision !== null) {
    vars.decision = decision;
  }

  execSql(
    "insert into public.excuses (day_id, profile_id, body, decided_at, decision)\n" +
      `values (:'day_id', :'profile_id', '개인 사정', ${decidedAtSql}, ${decisionSql});\n`,
    vars,
  );
}

export function seedWorkRequest(
  slotId: string,
  requestedBy: string,
  expiresAt: string | null = null,
): string {
  const id = randomUUID();
  const expiresSql =
    expiresAt === null ? "now() + interval '1 hour'" : ":'expires_at'";
  const vars: Record<string, string> = {
    id,
    slot_id: slotId,
    requested_by: requestedBy,
  };
  if (expiresAt !== null) {
    vars.expires_at = expiresAt;
  }
  execSql(
    `insert into public.requests (id, kind, slot_id, requested_by, expires_at) values (:'id', 'work', :'slot_id', :'requested_by', ${expiresSql});\n`,
    vars,
  );
  return id;
}

function reopenRequest(requestId: string): void {
  execSql("update public.requests set closed_at = null where id = :'id';\n", {
    id: requestId,
  });
}

function stillLive(expiresAt: string | null): boolean {
  return expiresAt === null || Date.parse(expiresAt) > Date.now();
}

export function seedRequestCandidate(
  requestId: string,
  profileId: string,
  status: "pending" | "accepted" | "declined" = "pending",
  expiresAt: string | null = null,
): string {
  const id = randomUUID();
  const expiresSql =
    expiresAt === null ? "now() + interval '1 hour'" : ":'expires_at'";
  const respondedSql = status === "pending" ? "null" : "now()";
  const vars: Record<string, string> = {
    id,
    request_id: requestId,
    profile_id: profileId,
    status,
  };
  if (expiresAt !== null) {
    vars.expires_at = expiresAt;
  }
  execSql(
    `insert into public.request_candidates (id, request_id, profile_id, status, responded_at, expires_at) values (:'id', :'request_id', :'profile_id', :'status', ${respondedSql}, ${expiresSql});\n`,
    vars,
  );

  if (status === "pending" && stillLive(expiresAt)) {
    reopenRequest(requestId);
  }

  return id;
}

export function seedCancelRequest(
  assignmentId: string,
  profileId: string,
  reason: string = "개인 사정",
  decision: "approved" | "rejected" | null = null,
  decisionReason: string | null = null,
): string {
  const id = randomUUID();
  const decisionSql = decision === null ? "null" : ":'decision'";
  const decidedAtSql = decision === null ? "null" : "now()";
  const decisionReasonSql =
    decisionReason === null ? "null" : ":'decision_reason'";
  const vars: Record<string, string> = {
    id,
    assignment_id: assignmentId,
    profile_id: profileId,
    reason,
  };
  if (decision !== null) {
    vars.decision = decision;
  }
  if (decisionReason !== null) {
    vars.decision_reason = decisionReason;
  }
  execSql(
    `insert into public.cancel_requests (id, assignment_id, profile_id, reason, decided_at, decision, decision_reason) values (:'id', :'assignment_id', :'profile_id', :'reason', ${decidedAtSql}, ${decisionSql}, ${decisionReasonSql});\n`,
    vars,
  );
  return id;
}

export function endAssignment(assignmentId: string): void {
  execSql(
    "update public.assignments set ended_at = now(), ended_reason = 'ended_for_test' where id = :'id';\n",
    { id: assignmentId },
  );
}

export function seedNotifications(
  profileId: string,
  count: number,
  kind: string = "signup_approved",
): string[] {
  const ids = Array.from({ length: count }, () => randomUUID());
  const values = ids
    .map(
      (id, index) =>
        `('${id}', '${profileId}', '${kind}', '{}'::jsonb, now() - interval '${index} seconds')`,
    )
    .join(",\n");

  execSql(
    "insert into public.notifications (id, profile_id, kind, payload, created_at) values\n" +
      `${values};\n`,
  );

  return ids;
}

export type SeededPastDay = {
  dayId: string;
  scheduleId: string;
  workDate: string;
  startsAt: string;
  endsAt: string;
};

export async function seedDayEndedHoursAgo(
  admin: AdminUser,
  hoursAgo: number,
  startsAtTime: string = "09:00:00",
): Promise<SeededPastDay> {
  const target = new Date(Date.now() - hoursAgo * 3600 * 1000);
  const { workDate, time: endsAt } = kstParts(target);
  const month = `${workDate.slice(0, 7)}-01`;

  execSql(
    [
      "delete from public.days where work_date = :'work_date';",
      "insert into public.schedules (month, created_by) values (:'month', :'created_by') on conflict (month) do nothing;",
      "insert into public.days (schedule_id, work_date, starts_at, ends_at, opened_by)",
      "select id, :'work_date', :'starts_at', :'ends_at', :'created_by' from public.schedules where month = :'month';",
    ].join("\n") + "\n",
    {
      month,
      created_by: admin.profileId,
      work_date: workDate,
      starts_at: startsAtTime,
      ends_at: endsAt,
    },
  );

  const { data, error } = await admin.client
    .from("days")
    .select("id, schedule_id")
    .eq("work_date", workDate)
    .single<{ id: string; schedule_id: string }>();
  if (error || !data) {
    throw error ?? new Error("만든 날을 못 찾았다");
  }

  return {
    dayId: data.id,
    scheduleId: data.schedule_id,
    workDate,
    startsAt: startsAtTime,
    endsAt,
  };
}

export type SeedNotificationRowInput = {
  profileId: string;
  kind?: string;
  payload?: Record<string, unknown>;
  claimedAt?: string | null;
  pushAttempts?: number;
  pushedAt?: string | null;
  pushReceiptId?: string | null;
};

export function seedNotificationRow(input: SeedNotificationRowInput): string {
  const id = randomUUID();
  const columns = ["id", "profile_id", "kind", "payload", "push_attempts"];
  const values = [
    ":'id'",
    ":'profile_id'",
    ":'kind'",
    ":'payload'::jsonb",
    ":'push_attempts'::integer",
  ];
  const vars: Record<string, string> = {
    id,
    profile_id: input.profileId,
    kind: input.kind ?? "test_kind",
    payload: JSON.stringify(input.payload ?? {}),
    push_attempts: String(input.pushAttempts ?? 0),
  };

  if (input.claimedAt !== undefined) {
    columns.push("claimed_at");
    if (input.claimedAt === null) {
      values.push("null");
    } else {
      values.push(":'claimed_at'::timestamptz");
      vars.claimed_at = input.claimedAt;
    }
  }

  if (input.pushedAt !== undefined) {
    columns.push("pushed_at");
    if (input.pushedAt === null) {
      values.push("null");
    } else {
      values.push(":'pushed_at'::timestamptz");
      vars.pushed_at = input.pushedAt;
    }
  }

  if (input.pushReceiptId !== undefined) {
    columns.push("push_receipt_id");
    if (input.pushReceiptId === null) {
      values.push("null");
    } else {
      values.push(":'push_receipt_id'");
      vars.push_receipt_id = input.pushReceiptId;
    }
  }

  execSql(
    `insert into public.notifications (${columns.join(", ")})\n` +
      `values (${values.join(", ")});\n`,
    vars,
  );
  return id;
}

export function seedPushToken(
  profileId: string,
  token: string = `ExponentPushToken[${randomUUID()}]`,
): string {
  execSql(
    "insert into public.push_tokens (profile_id, token) values (:'profile_id', :'token');\n",
    { profile_id: profileId, token },
  );
  return token;
}
