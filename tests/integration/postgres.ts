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

export function seedAssignment(
  dayId: string,
  profileId: string,
  kind: "regular" | "training" = "training",
  slotId: string | null = null,
): string {
  const id = randomUUID();
  const slotSql = slotId === null ? "null" : `'${slotId}'`;
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
