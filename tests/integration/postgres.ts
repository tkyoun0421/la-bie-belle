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

/**
 * 퇴사 시각을 과거로 민다. `createLeftUser`는 `left_at = now()`만 만들어 1년 경계를
 * 못 때린다 — `backdateDeadline`과 같은 손이다.
 */
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

/**
 * 지난 달의 근무표·날·자리를 직접 꽂는 셋이다. `create_schedule`도 `open_day`도 오늘보다 이른
 * 날짜를 거절해서(`date_past`) 급여 화면의 시드는 RPC로 못 만든다 — `backdateDeadline`과 같은
 * 손이다.
 *
 * 결근은 저장하는 배치가 없다. 「인증 창이 닫혔고 그 뒤로 48시간이 지났다」를 그때그때 계산하는
 * 값이라 진짜로 지나간 달력 날짜라야 결근한 날이 선다.
 */
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

/**
 * 그 날 제시간에 눌렀다는 사실이다. 지난 날은 인증 창이 이미 닫혀 이 행이 없으면 결근으로
 * 판정된다(attendance/README.md) — 지난 달에 일한 날을 심으려면 배정과 이 행이 한 짝이다.
 */
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

/**
 * 공휴일 한 줄을 직접 꽂는다. `api` 행을 넣는 길은 `internal.import_holidays` 하나인데 그
 * 함수가 `internal`이라 PostgREST로 못 부른다 — `seedWageHistory`·`backdateDeadline`과 같은
 * 손이다(payroll/design.md 「공휴일 넣기」).
 */
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

/** 포지션 하나짜리 자리다. 내역 줄이 그 포지션을 그대로 적어(payroll.md 「내역 목록」) 자리와 배정이 같은 이름을 들어야 한다. */
export function seedSlotOfPosition(dayId: string, position: string): string {
  const id = randomUUID();
  execSql(
    "insert into public.slots (id, day_id, positions) values (:'id', :'day_id', array[:'position']);\n",
    { id, day_id: dayId, position },
  );
  return id;
}

/**
 * 포지션 둘을 합친 겸임 자리다. 앉는 사람은 하나고 앞 포지션(`positions[0]`)으로 센다
 * (`docs/2-design/system/screens/stats.md`의 「근무 포지션 구획」).
 */
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

/**
 * 사유 하나를 직접 꽂는다. `"approved"`면 출근 인정으로 잡힌다
 * (`entities/attendance/model/attendance-status.ts`의 `getAttendanceStatus`).
 *
 * `submit_excuse`·`decide_excuse` RPC로는 지난 날짜의 사유를 못 만든다 — `backdateDeadline`과
 * 같은 손이다.
 */
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

/**
 * 알림 여러 건을 한 문장으로 심는다. `created_at`을 index만큼 과거로 밀어 순서를 고정한다 —
 * `ids[0]`이 가장 최근이고 `ids[count - 1]`이 가장 오래됐다. 여러 `execSql` 호출로 나누면 그
 * 사이 틈을 배경 작업이 볼 수 있어서(관찰 024) 한 INSERT에 값을 전부 담는다.
 */
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
