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

export type SeededWageRate = {
  date: string;
  amount: number;
  followsDefault: boolean;
};

/**
 * 지난 날짜의 시급 행을 직접 꽂는다. `set_wage`는 오늘만 받아서(PAY-008) 이력이 여러 줄인
 * 사람을 함수로는 못 만든다 — `backdateDeadline`과 같은 손이다.
 *
 * 오늘 행은 여기서 안 만든다. 승인과 `set_wage`가 만드는 행이라 부르는 쪽이 함수로 세운다.
 */
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

// 폭을 90000으로 묶는 것은 연도 네 자리를 지키려는 것이다. 다섯 자리 연도가 나오면
// `kstInstant`가 만드는 `10278-09-01T22:00:00+09:00`을 Date가 못 읽어 NaN이 된다.
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

/**
 * 활성 관리자(재직 중·차단 안 됨)가 `adminProfileId` 하나뿐인 상태를 잠시 만든다.
 * DB에 이미 쌓인 다른 관리자들의 `left_at`을 잠시 `now()`로 밀어 셈에서 빼고, `fn`이
 * 끝나면(실패해도) 기억해둔 id로 되돌린다. `jest.integration.config.js`가
 * `maxWorkers: 1`이라 다른 테스트 파일과 겹치지 않는다.
 */
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

/** `submit_profile`을 실제로 불러 「제출됨」(승인·거절·차단 전) 상태를 만든다. */
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

/**
 * 정규 배정은 자리에 앉는다 — 표의 check가 `slot_id`를 요구하고 살아 있는 정규 배정은 자리
 * 하나에 하나다. 자리를 안 넘기면 여기서 새로 하나 세운다.
 */
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
): string {
  const id = randomUUID();
  const seatId =
    kind === "regular" && slotId === null ? seedSlot(dayId) : slotId;
  const slotSql = seatId === null ? "null" : `'${seatId}'`;
  execSql(
    `insert into public.assignments (id, day_id, slot_id, position, profile_id, kind) values (:'id', :'day_id', ${slotSql}, '안내', :'profile_id', :'kind');\n`,
    {
      id,
      day_id: dayId,
      profile_id: profileId,
      kind,
    },
  );
  return id;
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

/**
 * `requests`의 갈래 하나다 — `request_candidates`. `seedWorkRequest`가 만든 요청에 후보를
 * 더할 때 쓴다. `pending`이 아니면 `responded_at`도 같이 찍는다.
 */
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
  return id;
}

/**
 * 근무 취소 요청 한 행이다. 판정된 것을 시드할 때는 `decision`을 준다 — 그때만
 * `decided_at`·`decision_reason`을 같이 찍는다.
 */
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

/** 배정 하나를 끝난 것으로 만든다 — `stale` 판정을 시험할 때 쓴다. */
export function endAssignment(assignmentId: string): void {
  execSql(
    "update public.assignments set ended_at = now(), ended_reason = 'ended_for_test' where id = :'id';\n",
    { id: assignmentId },
  );
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
