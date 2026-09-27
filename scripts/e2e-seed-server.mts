// e2e가 세션을 심으려면 「그 상태인 사람」이 DB에 먼저 있어야 한다. 그 사람을 만들어 토큰을
// 돌려주는 로컬 서버다.
//
//   POST http://127.0.0.1:8765/seed  {"state": "rejected"}
//   → {"access_token": "…", "refresh_token": "…", "user_id": "…", "profile": {…}}
//
// 상태는 열다섯이다 — fresh · submitted · approved · admin · rejected · left · blocked ·
// read_failure · schedule_submission_window · schedule_confirmed와, 관리자 근무표 다섯
// (schedule_admin_empty_month · schedule_admin_race_open · schedule_admin_confirmable ·
// schedule_admin_confirmed · schedule_admin_applications). `name`은 선택이고, 프로필을
// 보내는 상태에서 그 사람의 이름을 고른다(안 주면 SEEDED_PROFILE의 이름이다). `month`·`day`도
// 선택이고 schedule_admin_race_open만 쓴다 — 이미 로그인된 세션 밖에서 먼저 열 날짜다.
// 근무표 상태들은 사람만이 아니라 그 사람이 볼 근무표까지 세우고, 화면에 그대로 뜨는 라벨을
// 같이 돌려준다 — 계약은 `tests/e2e/schedule-worker.yaml`과 `tests/e2e/schedule-admin.yaml`과
// `tests/e2e/applications.yaml` 머리말이다.
// 부르는 쪽은 `tests/e2e/scripts/seed-session.js`고, 받은 토큰을 개발 빌드의 테스트 문
// (`src/app/__test/session.tsx`)에 딥링크로 싣는다. 정본은 `docs/4-test/execution.md`의
// 「`pnpm e2e`」 절이다.
//
// 사람을 만드는 손은 integration 테스트가 쓰는 것을 그대로 쓴다 — 같은 상태를 두 군데서
// 다르게 만들면 e2e가 본 상태와 integration이 본 상태가 갈린다.
//
// **프로덕션에는 절대 안 붙는다.** 앱이 보는 Supabase가 로컬이 아니면 뜨기 전에 죽는다.
// 이 서버는 사용자를 만들고 관리자 권한을 올리는 일을 하므로 겨눈 곳이 어디인지가 전부다.

import { createServer, type IncomingMessage, type Server } from "node:http";
import { formatBareDate } from "@/screens/schedule-admin/model/format-schedule-date";
import { spellWorkDate } from "@/screens/schedule-worker/model/agenda-row";
import {
  kstToday,
  spellDeadline,
  spellMonth,
} from "@/screens/schedule-worker/model/month-state";
import {
  backdateDeadline,
  createAdminUser,
  execSql,
  kstDate,
  kstMonthStart,
  seedAssignment,
  withFreshMonth,
  type AdminUser,
} from "@tests/integration/postgres";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

export const SEED_PORT = 8765;

const SEED_HOST = "127.0.0.1";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

const READ_FAILURE = "read_failure";

/**
 * 프로필을 보낸 사람의 다섯은 고정값이다. `tests/e2e/pending.yaml`이 거절된 사람의 굳은
 * 글에, `tests/e2e/profile.yaml`이 승인된 사람의 「나」 화면에 이 값이 그대로 서는지
 * 단언한다 — 사람 이름과 번호는 전부 가짜다.
 *
 * **이름만 부르는 쪽이 고를 수 있다.** 한 화면에 승인된 사람을 여럿 세우는 플로우
 * (`tests/e2e/members.yaml`)가 검색이 한 줄만 남기는지 보려면 이름이 갈려야 한다. 번호와
 * 생년월일은 그대로 둔다 — ACC-005가 같은 번호 둘을 안 막는다.
 */
const SEEDED_PROFILE = {
  name: "박서연",
  gender: "male",
  birthDate: "1990-11-05",
  phone: "010-0000-0002",
};

const SUBMISSION_WINDOW = "schedule_submission_window";

const SCHEDULE_CONFIRMED = "schedule_confirmed";

const ADMIN_EMPTY_MONTH = "schedule_admin_empty_month";

const ADMIN_RACE_OPEN = "schedule_admin_race_open";

const ADMIN_CONFIRMABLE = "schedule_admin_confirmable";

const ADMIN_CONFIRMED = "schedule_admin_confirmed";

const ADMIN_APPLICATIONS = "schedule_admin_applications";

const STATES = [
  "fresh",
  "submitted",
  "approved",
  "admin",
  "rejected",
  "left",
  "blocked",
  READ_FAILURE,
  SUBMISSION_WINDOW,
  SCHEDULE_CONFIRMED,
  ADMIN_EMPTY_MONTH,
  ADMIN_RACE_OPEN,
  ADMIN_CONFIRMABLE,
  ADMIN_CONFIRMED,
  ADMIN_APPLICATIONS,
] as const;

export type SeedState = (typeof STATES)[number];

/** 관리자 근무표 플로우가 쓰는 다섯이다 — 전부 관리자로 로그인한다. */
const ADMIN_SCHEDULE_STATES = new Set<SeedState>([
  ADMIN_EMPTY_MONTH,
  ADMIN_RACE_OPEN,
  ADMIN_CONFIRMABLE,
  ADMIN_CONFIRMED,
  ADMIN_APPLICATIONS,
]);

/**
 * 근무표 상태 둘이 같이 싣는 값이다. 계약은 `tests/e2e/schedule-worker.yaml` 머리말에 있다 —
 * raw `month`는 딥링크와 `schedule-day-<날짜>` testID를 조립하는 데 쓰고, 라벨 셋은 화면
 * 문구를 그대로 단언하는 데 쓴다.
 *
 * **라벨을 화면과 같은 함수로 만든다.** 여기서 따로 조립하면 플로우가 보는 것은 시드 서버의
 * 문구지 화면의 문구가 아니게 된다.
 */
type SchedulePayload = {
  month: string;
  monthLabel: string;
  deadlineLabel?: string;
  myDateLabel?: string;
  otherDateLabel?: string;
  deadlineDate?: string;
  failedOpenDayLabel?: string;
};

type SeedResponse = Partial<SchedulePayload> & {
  access_token: string;
  refresh_token: string;
  user_id: string;
  profile: typeof SEEDED_PROFILE | null;
  simulate?: string;
};

function assertLocalTarget(): void {
  const target = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const host = URL.canParse(target) ? new URL(target).hostname : "";

  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `시드 서버는 로컬에서만 돈다. EXPO_PUBLIC_SUPABASE_URL 이 "${target}" 다 — ` +
        "`supabase status -o env` 의 API_URL 을 넣고 다시 돌려라.",
    );
  }
}

async function tokensOf(user: SignedInUser): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const { data, error } = await user.client.auth.getSession();

  if (error || !data.session) {
    throw error ?? new Error("가입은 됐는데 세션 토큰이 없다");
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  };
}

async function submitSeededProfile(
  user: SignedInUser,
  profile: typeof SEEDED_PROFILE,
): Promise<void> {
  const { error } = await user.client.rpc("submit_profile", {
    display_name: profile.name,
    phone: profile.phone,
    birth_date: profile.birthDate,
    gender: profile.gender,
  });

  if (error) {
    throw error;
  }
}

/**
 * 관리자 판정 하나를 대상에게 내린다. 화면이 부르는 것과 같은 함수를 부른다 — SQL로
 * 열을 직접 채우면 e2e가 본 상태와 함수가 만드는 상태가 갈린다.
 */
async function decideBy(
  decision: "approve_member" | "reject_member" | "block_member" | "mark_leave",
  profileId: string,
): Promise<void> {
  const admin = await createAdminUser();
  const { error } = await admin.client.rpc(decision, { profile_id: profileId });

  if (error) {
    throw error;
  }
}

async function seededUser(
  state: SeedState,
  name: string,
): Promise<{ user: SignedInUser; profile: typeof SEEDED_PROFILE | null }> {
  if (state === "admin" || ADMIN_SCHEDULE_STATES.has(state)) {
    return { user: await createAdminUser(), profile: null };
  }

  const user = await createSignedInUser();

  if (state === "fresh" || state === READ_FAILURE) {
    return { user, profile: null };
  }

  const profile = { ...SEEDED_PROFILE, name };

  await submitSeededProfile(user, profile);

  // 승인된 사람은 「나」 화면에서 자기 다섯을 본다(tests/e2e/profile.yaml). 열을 SQL로
  // 직접 채우는 createApprovedUser로는 개인정보 행이 안 생겨 그 화면이 빈 줄로 선다 —
  // 신청자를 만들어 관리자가 받는 실제 경로를 그대로 밟는다.
  if (state === "approved") {
    await decideBy("approve_member", user.profileId);
  }

  if (state === "rejected") {
    await decideBy("reject_member", user.profileId);
  }

  // 차단은 「제출됨」 사람만 대상이라(design.md 「가입 승인·거절·차단·해제」) 프로필을 먼저
  // 보낸 뒤 차단한다. 차단한 사람 목록이 이름 있는 줄을 보여줘야 하는 것도 같은 이유다.
  if (state === "blocked") {
    await decideBy("block_member", user.profileId);
  }

  // 퇴사도 승인된 사람만 대상이라 받고 나서 내보낸다. 직원 화면의 퇴사 구획이 이름 있는
  // 줄을 보여줘야 해서(tests/e2e/members.yaml) 프로필을 먼저 보낸다.
  if (state === "left") {
    await decideBy("approve_member", user.profileId);
    await decideBy("mark_leave", user.profileId);
  }

  // 근무표 두 상태의 주인공은 승인된 근무자다. 그 사람 이름이 날 시트 명단에 서야 해서
  // 「승인됨」과 같은 길 — 신청을 보내고 관리자가 받는 — 을 그대로 밟는다.
  if (state === SUBMISSION_WINDOW || state === SCHEDULE_CONFIRMED) {
    await decideBy("approve_member", user.profileId);
  }

  return { user, profile };
}

function throwIf(error: unknown): void {
  if (error) {
    throw error;
  }
}

async function createSchedule(
  admin: AdminUser,
  monthDate: string,
  deadline: string,
): Promise<void> {
  const { error } = await admin.client.rpc("create_schedule", {
    p_month: monthDate,
    p_deadline: deadline,
  });

  throwIf(error);
}

async function openDay(admin: AdminUser, workDate: string): Promise<void> {
  const { error } = await admin.client.rpc("open_day", {
    p_work_date: workDate,
  });

  throwIf(error);
}

async function confirmSchedule(
  admin: AdminUser,
  monthDate: string,
): Promise<void> {
  const { error } = await admin.client.rpc("confirm_schedule", {
    p_month: monthDate,
  });

  throwIf(error);
}

async function scheduleIdOf(
  admin: AdminUser,
  monthDate: string,
): Promise<string> {
  const { data, error } = await admin.client
    .from("schedules")
    .select("id")
    .eq("month", monthDate)
    .single<{ id: string }>();

  if (error || !data) {
    throw error ?? new Error("만든 근무표를 못 찾았다");
  }

  return data.id;
}

async function dayIdOf(admin: AdminUser, workDate: string): Promise<string> {
  const { data, error } = await admin.client
    .from("days")
    .select("id")
    .eq("work_date", workDate)
    .single<{ id: string }>();

  if (error || !data) {
    throw error ?? new Error("연 날을 못 찾았다");
  }

  return data.id;
}

async function freeSlotOf(admin: AdminUser, dayId: string): Promise<string> {
  const { data, error } = await admin.client
    .from("slots")
    .select("id")
    .eq("day_id", dayId)
    .is("ended_at", null)
    .limit(1)
    .single<{ id: string }>();

  if (error || !data) {
    throw error ?? new Error("그 날의 자리를 못 찾았다");
  }

  return data.id;
}

function setDisplayName(profileId: string, displayName: string): void {
  execSql(
    "update public.profiles set display_name = :'display_name' where id = :'profile_id';\n",
    { profile_id: profileId, display_name: displayName },
  );
}

/**
 * 접수 중인 달 하나와 그 다음 달(마감 지남·미확정) 하나를 세우고 그다음 달은 아예 안 만든다.
 * 플로우가 다음 달 화살표만 두 번 눌러 세 모습을 지나간다 —
 * `tests/e2e/schedule-worker.yaml` 머리말의 계약이다.
 */
async function seedSubmissionWindow(): Promise<SchedulePayload> {
  const admin = await createAdminUser();
  const today = kstToday();
  const deadline = kstDate(3);

  return withFreshMonth(async (monthsFromNow) => {
    const openMonth = kstMonthStart(monthsFromNow);
    const closedMonth = kstMonthStart(monthsFromNow + 1);

    await createSchedule(admin, openMonth, deadline);
    await createSchedule(admin, closedMonth, deadline);
    backdateDeadline(await scheduleIdOf(admin, closedMonth), kstDate(-1));

    return {
      month: openMonth.slice(0, 7),
      monthLabel: spellMonth(openMonth.slice(0, 7)),
      deadlineLabel: spellDeadline(deadline, today),
    };
  });
}

/**
 * 확정된 달 하나다. 1일에는 내가, 2일에는 동료만 배정된다 — 날 시트의 버튼 둘이 서는 날과
 * 안 서는 날을 한 달 안에서 가른다.
 */
async function seedConfirmedMonth(
  meProfileId: string,
): Promise<SchedulePayload> {
  const admin = await createAdminUser();
  const colleague = await createSignedInUser();

  await submitSeededProfile(colleague, { ...SEEDED_PROFILE, name: "이도윤" });
  await decideBy("approve_member", colleague.profileId);
  setDisplayName(colleague.profileId, "이도윤");

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);
    const myDate = `${month}-01`;
    const otherDate = `${month}-02`;

    await createSchedule(admin, monthDate, kstDate(1));
    await openDay(admin, myDate);
    await openDay(admin, otherDate);

    const myDayId = await dayIdOf(admin, myDate);
    const otherDayId = await dayIdOf(admin, otherDate);

    seedAssignment(
      myDayId,
      meProfileId,
      "regular",
      await freeSlotOf(admin, myDayId),
    );
    seedAssignment(
      otherDayId,
      colleague.profileId,
      "regular",
      await freeSlotOf(admin, otherDayId),
    );

    backdateDeadline(await scheduleIdOf(admin, monthDate), kstDate(-1));
    await confirmSchedule(admin, monthDate);

    return {
      month,
      monthLabel: spellMonth(month),
      myDateLabel: spellWorkDate(myDate),
      otherDateLabel: spellWorkDate(otherDate),
    };
  });
}

/**
 * 근무표를 하나도 안 만든 달이다. 그 달에 `schedules` 행이 없어야 달력 대신 빈 상태가 선다 —
 * 그래서 이 상태는 달을 고르기만 하고 아무것도 만들지 않는다. `deadlineDate`는 만들기 시트의
 * 날짜 입력에 그대로 타이핑할 값이라 라벨이 아니라 raw `"YYYY-MM-DD"`다.
 */
async function seedAdminEmptyMonth(): Promise<SchedulePayload> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow).slice(0, 7);

    return {
      month,
      monthLabel: spellMonth(month),
      deadlineDate: kstDate(3),
    };
  });
}

/**
 * 다른 관리자가 그 사이에 날을 먼저 여는 것이다. 세션을 안 바꾸고 로그인된 사람과 무관한
 * 관리자로 `open_day`를 부른다 — 화면이 그린 시점(닫혀 있었다)과 서버가 처리하는 시점(이미
 * 열렸다) 사이의 경합이 부분 실패의 정체다.
 */
async function seedAdminRaceOpen(
  month: string,
  day: string,
): Promise<SchedulePayload> {
  const other = await createAdminUser();
  const workDate = `${month}-${day}`;

  await openDay(other, workDate);

  return {
    month,
    monthLabel: spellMonth(month),
    failedOpenDayLabel: formatBareDate(workDate),
  };
}

/**
 * 마감이 지났고 아직 미확정인 달이다. 배정을 하나도 안 만들어 자리 기본값이 전부 빈 자리로
 * 남고, 확정 시트의 경고 블록이 저절로 선다.
 */
async function seedAdminConfirmable(): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);

    await createSchedule(admin, monthDate, kstDate(1));
    await openDay(admin, `${month}-01`);
    backdateDeadline(await scheduleIdOf(admin, monthDate), kstDate(-1));

    return { month, monthLabel: spellMonth(month) };
  });
}

/** 이미 확정한 달이다. 3일은 안 연 채로 남긴다 — 확정 뒤에도 열 날이 있어야 한다. */
async function seedAdminConfirmed(): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);

    await createSchedule(admin, monthDate, kstDate(1));
    await openDay(admin, `${month}-01`);
    backdateDeadline(await scheduleIdOf(admin, monthDate), kstDate(-1));
    await confirmSchedule(admin, monthDate);

    return { month, monthLabel: spellMonth(month) };
  });
}

/** 마감이 아직 남은 달이다. 근무 신청은 하나도 안 만든다 — 0건 빈 상태를 그대로 쓴다. */
async function seedAdminApplications(): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);

    await createSchedule(admin, monthDate, kstDate(3));

    return { month, monthLabel: spellMonth(month) };
  });
}

export type SeedRequest = {
  name?: string;
  month?: string;
  day?: string;
};

async function schedulePayloadOf(
  state: SeedState,
  profileId: string,
  asked: SeedRequest,
): Promise<Partial<SchedulePayload>> {
  if (state === SUBMISSION_WINDOW) {
    return seedSubmissionWindow();
  }

  if (state === SCHEDULE_CONFIRMED) {
    return seedConfirmedMonth(profileId);
  }

  if (state === ADMIN_EMPTY_MONTH) {
    return seedAdminEmptyMonth();
  }

  if (state === ADMIN_RACE_OPEN) {
    if (asked.month === undefined || asked.day === undefined) {
      throw new Error(`${ADMIN_RACE_OPEN} 은 month 와 day 를 같이 받아야 한다`);
    }

    return seedAdminRaceOpen(asked.month, asked.day);
  }

  if (state === ADMIN_CONFIRMABLE) {
    return seedAdminConfirmable();
  }

  if (state === ADMIN_CONFIRMED) {
    return seedAdminConfirmed();
  }

  if (state === ADMIN_APPLICATIONS) {
    return seedAdminApplications();
  }

  return {};
}

export async function seed(
  state: SeedState,
  asked: SeedRequest = {},
): Promise<SeedResponse> {
  const { user, profile } = await seededUser(
    state,
    asked.name ?? SEEDED_PROFILE.name,
  );

  return {
    ...(await tokensOf(user)),
    user_id: user.userId,
    profile,
    ...(state === READ_FAILURE ? { simulate: READ_FAILURE } : {}),
    ...(await schedulePayloadOf(state, user.profileId, asked)),
  };
}

function isSeedState(value: unknown): value is SeedState {
  return STATES.includes(value as SeedState);
}

/** 빈 문자열은 안 준 것과 같다 — 부르는 쪽이 env가 없을 때 빈 값을 보낸다. */
function givenText(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
}

export function startSeedServer(): Promise<Server> {
  assertLocalTarget();

  const server = createServer((request, response) => {
    void (async () => {
      if (request.method !== "POST" || request.url !== "/seed") {
        response.writeHead(404).end();
        return;
      }

      try {
        const { state, name, month, day } = JSON.parse(
          await readBody(request),
        ) as {
          state?: unknown;
          name?: unknown;
          month?: unknown;
          day?: unknown;
        };

        if (!isSeedState(state)) {
          response
            .writeHead(400, { "Content-Type": "application/json" })
            .end(JSON.stringify({ error: `모르는 상태다: ${String(state)}` }));
          return;
        }

        response.writeHead(200, { "Content-Type": "application/json" }).end(
          JSON.stringify(
            await seed(state, {
              name: givenText(name),
              month: givenText(month),
              day: givenText(day),
            }),
          ),
        );
      } catch (error) {
        response
          .writeHead(500, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: String(error) }));
      }
    })();
  });

  return new Promise((resolve) => {
    server.listen(SEED_PORT, SEED_HOST, () => resolve(server));
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const server = await startSeedServer();

  console.warn(`시드 서버: http://${SEED_HOST}:${SEED_PORT}/seed`);

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}
