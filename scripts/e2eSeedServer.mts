// e2e가 세션을 심으려면 「그 상태인 사람」이 DB에 먼저 있어야 한다. 그 사람을 만들어 토큰을
// 돌려주는 로컬 서버다.
//
//   POST http://127.0.0.1:8765/seed  {"state": "rejected"}
//   → {"access_token": "…", "refresh_token": "…", "user_id": "…", "profile": {…}}
//
// 상태는 서른 개다 — fresh · submitted · approved · admin · rejected · left · blocked ·
// read_failure · schedule_submission_window · schedule_confirmed와, 관리자 근무표 여덟
// (schedule_admin_empty_month · schedule_admin_race_open · schedule_admin_confirmable ·
// schedule_admin_confirmed · schedule_admin_applications · schedule_assign_day ·
// schedule_admin_request_slot · schedule_approvals_cancel_pending), 요청을 받는 근무자 둘
// (schedule_worker_request_pending · schedule_worker_request_claimed), 리허설 하나
// (rehearsal_qualified), 시급 하나(payroll_wages), 급여 조회 둘(payroll_view ·
// payroll_view_left), 근무 조정 하나(payroll_adjust), 통계 둘(stats_admin_overview ·
// stats_worker_overview), 알림 목록 셋(notification_list · notification_list_empty ·
// notification_list_many). `name`은
// 선택이고, 프로필을 보내는 상태에서 그 사람의 이름을 고른다(안 주면 SEEDED_PROFILE의
// 이름이다). 요청의 `month`·`day`도 선택이고 schedule_admin_race_open만 쓴다 — 이미
// 로그인된 세션 밖에서 먼저 열 날짜다. 응답의 `day`는 schedule_assign_day와
// payroll_adjust가 싣는다 — 그 플로우들이 달력을 안 거치고 날 상세 딥링크를 바로 조립한다.
// `holidayDay`는 payroll_adjust만 싣는다 — 받아온 공휴일이 심긴 다른 날짜다.
// 근무표 상태들은 사람만이 아니라 그 사람이 볼 근무표까지 세우고, 화면에 그대로 뜨는 라벨을
// 같이 돌려준다 — 계약은 `tests/e2e/schedule-worker.yaml`과 `tests/e2e/schedule-admin.yaml`과
// `tests/e2e/schedule-assign.yaml`과 `tests/e2e/applications.yaml` 머리말이다. 알림 목록
// 셋의 계약은 `tests/e2e/notifications.yaml` 머리말이다.
// 부르는 쪽은 `tests/e2e/scripts/seedSession.js`고, 받은 토큰을 개발 빌드의 테스트 문
// (`src/app/__test/session.tsx`)에 딥링크로 싣는다. 정본은 `docs/4-test/execution.md`의
// 「`pnpm e2e`」 절이다.
//
// 사람을 만드는 손은 integration 테스트가 쓰는 것을 그대로 쓴다 — 같은 상태를 두 군데서
// 다르게 만들면 e2e가 본 상태와 integration이 본 상태가 갈린다.
//
// **프로덕션에는 절대 안 붙는다.** 앱이 보는 Supabase가 로컬이 아니면 뜨기 전에 죽는다.
// 이 서버는 사용자를 만들고 관리자 권한을 올리는 일을 하므로 겨눈 곳이 어디인지가 전부다.

import { createServer, type IncomingMessage, type Server } from "node:http";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { formatBareDate } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";
import {
  spellDeadline,
  spellMonth,
} from "@/screens/scheduleWorker/model/monthState.policy";
import { spellWorkDate } from "@/screens/scheduleWorker/utils/agendaRow.utils";
import {
  approveProfile,
  backdateDeadline,
  createAdminUser,
  execSql,
  kstDate,
  kstInstant,
  kstMonthStart,
  seedAssignment,
  seedCancelRequest,
  seedCheckIn,
  seedExcuse,
  seedJointSlot,
  seedNotifications,
  seedPastDay,
  seedPastSchedule,
  seedHoliday,
  seedRequestCandidate,
  seedSlotOfPosition,
  seedWageHistory,
  seedWorkRequest,
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

const ASSIGN_DAY = "schedule_assign_day";

const ADMIN_REQUEST_SLOT = "schedule_admin_request_slot";

const WORKER_REQUEST_PENDING = "schedule_worker_request_pending";

const WORKER_REQUEST_CLAIMED = "schedule_worker_request_claimed";

const APPROVALS_CANCEL_PENDING = "schedule_approvals_cancel_pending";

const REHEARSAL_QUALIFIED = "rehearsal_qualified";

const PAYROLL_WAGES = "payroll_wages";

const PAYROLL_VIEW = "payroll_view";

const PAYROLL_VIEW_LEFT = "payroll_view_left";

const PAYROLL_ADJUST = "payroll_adjust";

const STATS_ADMIN_OVERVIEW = "stats_admin_overview";

const STATS_WORKER_OVERVIEW = "stats_worker_overview";

const NOTIFICATION_LIST = "notification_list";

const NOTIFICATION_LIST_EMPTY = "notification_list_empty";

const NOTIFICATION_LIST_MANY = "notification_list_many";

/**
 * 근무자 통계가 심는 시급이다. `tests/e2e/stats.yaml` 머리말의 손계산 표가 이 값으로
 * 검산된다 — 급여 조회가 쓰는 값과 같지만 그쪽은 PAY-005 예시를 따라가는 자리라 상수를
 * 나눠 둔다.
 */
const STATS_WORKER_WAGE = 12000;

/**
 * 급여 조회가 심는 기본 시급이다. `README.md`의 PAY-005 원문 예시(「시급 12,000원인 사람이
 * 10시간 일하면 126,000원이다」)와 같은 값이라 `tests/e2e/payroll.yaml`이 단언하는 금액이 그
 * 예시로 그대로 검산된다.
 */
const PAYROLL_VIEW_WAGE = 12000;

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
  ASSIGN_DAY,
  ADMIN_REQUEST_SLOT,
  WORKER_REQUEST_PENDING,
  WORKER_REQUEST_CLAIMED,
  APPROVALS_CANCEL_PENDING,
  REHEARSAL_QUALIFIED,
  PAYROLL_WAGES,
  PAYROLL_VIEW,
  PAYROLL_VIEW_LEFT,
  PAYROLL_ADJUST,
  STATS_ADMIN_OVERVIEW,
  STATS_WORKER_OVERVIEW,
  NOTIFICATION_LIST,
  NOTIFICATION_LIST_EMPTY,
  NOTIFICATION_LIST_MANY,
] as const;

export type SeedState = (typeof STATES)[number];

/**
 * 관리자 화면 플로우가 쓰는 열이다 — 전부 관리자로 로그인한다.
 *
 * 근무 요청을 **받는** 쪽 둘(`schedule_worker_request_*`)은 여기 안 든다. 로그인하는 사람이
 * 요청을 받은 근무자라야 그 시트가 뜬다.
 */
const ADMIN_STATES = new Set<SeedState>([
  ADMIN_EMPTY_MONTH,
  ADMIN_RACE_OPEN,
  ADMIN_CONFIRMABLE,
  ADMIN_CONFIRMED,
  ADMIN_APPLICATIONS,
  ASSIGN_DAY,
  ADMIN_REQUEST_SLOT,
  APPROVALS_CANCEL_PENDING,
  PAYROLL_WAGES,
  PAYROLL_ADJUST,
  STATS_ADMIN_OVERVIEW,
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
  monthLabel?: string;
  day?: string;
  holidayDay?: string;
  deadlineLabel?: string;
  myDateLabel?: string;
  otherDateLabel?: string;
  deadlineDate?: string;
  failedOpenDayLabel?: string;
  slotClaimedLabel?: string;
  approvalListTitle?: string;
  approvalDetailTitle?: string;
  approvalConfirmBody?: string;
  approvalDayAppbar?: string;
  assignedDate?: string;
  freeDate?: string;
  assignedDateLabel?: string;
  freeDateLabel?: string;
  currentMonthLabel?: string;
  yearLabel?: string;
  overtimeDateLabel?: string;
  absentDateLabel?: string;
  rehearsalOnlyDateLabel?: string;
  lastMonthShortLabel?: string;
  secondMonthShortLabel?: string;
  statsWorkMonthLabel?: string;
  statsSecondMonthLabel?: string;
  statsEmptyMonthLabel?: string;
  statsWorkerMonthLabel?: string;
  statsWorkerPresentDateLabel?: string;
  statsWorkerLateDateLabel?: string;
  statsWorkerAbsentDateLabel?: string;
  statsWorkerExcusedDateLabel?: string;
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
  if (state === "admin" || ADMIN_STATES.has(state)) {
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
  if (
    state === SUBMISSION_WINDOW ||
    state === SCHEDULE_CONFIRMED ||
    state === WORKER_REQUEST_PENDING ||
    state === WORKER_REQUEST_CLAIMED ||
    state === REHEARSAL_QUALIFIED ||
    state === STATS_WORKER_OVERVIEW ||
    state === NOTIFICATION_LIST ||
    state === NOTIFICATION_LIST_EMPTY ||
    state === NOTIFICATION_LIST_MANY
  ) {
    await decideBy("approve_member", user.profileId);
  }

  // 급여 조회의 주인공은 기본 시급을 따르는 사람이다. `approve_member`가 오늘 행
  // (`follows_default = true`)을 같이 넣는 것은 기본 시급이 이미 서 있을 때뿐이라
  // (`approve_wage_row.sql`, PAY-012) 승인보다 먼저 세운다 — 순서를 뒤집으면 시급 이력이 빈
  // 채로 남아 그 사람의 모든 날이 「시급 미정」이 된다.
  if (state === PAYROLL_VIEW || state === PAYROLL_VIEW_LEFT) {
    const admin = await createAdminUser();

    throwIf(
      (
        await admin.client.rpc("set_default_wage", {
          p_amount: PAYROLL_VIEW_WAGE,
        })
      ).error,
    );
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

/**
 * 포지션을 골라 그 날의 빈 자리 하나를 집는다. 날 상세를 들여다보는 플로우는 어느 줄이
 * 채워졌는지를 단언하므로(`tests/e2e/schedule-assign.yaml`의 「안내 1/2」) 아무 자리나
 * 집는 `freeSlotOf`로는 그 줄이 회차마다 갈린다.
 */
async function freeSlotOfPosition(
  admin: AdminUser,
  dayId: string,
  position: string,
): Promise<string> {
  const { data, error } = await admin.client
    .from("slots")
    .select("id")
    .eq("day_id", dayId)
    .contains("positions", [position])
    .is("ended_at", null)
    .limit(1)
    .single<{ id: string }>();

  if (error || !data) {
    throw error ?? new Error(`${position} 자리를 못 찾았다`);
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

/**
 * 이미 확정한 달이다. 3일은 안 연 채로 남긴다 — 확정 뒤에도 열 날이 있어야 한다.
 *
 * 1일의 「안내」 자리 하나는 김하늘로 채워 확정한다. 확정 시점 날의 강제 변경
 * (`tests/e2e/schedule-assign.yaml`의 「사람 빼기」)이 채워진 자리에서 시작해서다. 근무자
 * 화면이 쓰는 이도윤(`seedConfirmedMonth`)과 이름을 갈라 한 화면에서 안 겹치게 둔다.
 * 3일만 들여다보는 `tests/e2e/schedule-admin.yaml`은 이 배정을 안 만난다.
 */
async function seedAdminConfirmed(): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  const colleague = await createSignedInUser();
  await submitSeededProfile(colleague, { ...SEEDED_PROFILE, name: "김하늘" });
  await decideBy("approve_member", colleague.profileId);

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);
    const workDate = `${month}-01`;

    await createSchedule(admin, monthDate, kstDate(1));
    await openDay(admin, workDate);

    await colleague.client.rpc("submit_availability", {
      p_month: monthDate,
      p_dates: [workDate],
    });

    const dayId = await dayIdOf(admin, workDate);

    seedAssignment(
      dayId,
      colleague.profileId,
      "regular",
      await freeSlotOfPosition(admin, dayId, "안내"),
    );

    backdateDeadline(await scheduleIdOf(admin, monthDate), kstDate(-1));
    await confirmSchedule(admin, monthDate);

    return { month, monthLabel: spellMonth(month) };
  });
}

/**
 * 열린 날 하나와 그 날을 채울 사람 셋이다. 이 상태만 `day`를 같이 싣는다 — 플로우가
 * 달력을 안 거치고 날 상세로 바로 들어가서다.
 *
 * 셋의 역할은 `tests/e2e/schedule-assign.yaml` 머리말이 정한다 — 박서연은 교육 배정과
 * 정규 배정을 이어 받고, 이도윤은 자격 없는 채로 남아 「이번만 넣기·자격도 주기」 갈래의
 * 주인공이고, 최유진은 신청을 안 내 「전체 보기」의 「신청 안 함」 줄로만 선다.
 */
async function seedAssignDay(): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  const workerA = await createSignedInUser();
  await submitSeededProfile(workerA, { ...SEEDED_PROFILE, name: "박서연" });
  await decideBy("approve_member", workerA.profileId);

  const workerB = await createSignedInUser();
  await submitSeededProfile(workerB, { ...SEEDED_PROFILE, name: "이도윤" });
  await decideBy("approve_member", workerB.profileId);

  const workerD = await createSignedInUser();
  await submitSeededProfile(workerD, { ...SEEDED_PROFILE, name: "최유진" });
  await decideBy("approve_member", workerD.profileId);

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);
    const day = "01";
    const workDate = `${month}-${day}`;

    await createSchedule(admin, monthDate, kstDate(3));
    await openDay(admin, workDate);

    await workerA.client.rpc("submit_availability", {
      p_month: monthDate,
      p_dates: [workDate],
    });
    await workerB.client.rpc("submit_availability", {
      p_month: monthDate,
      p_dates: [workDate],
    });

    return { month, day, monthLabel: spellMonth(month) };
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

/**
 * 아무도 신청을 안 낸 열린 날 하나다. 픽커의 기본 목록이 0명이라 전체 보기가 펼쳐진 채로
 * 열리고, 그 미신청 줄 둘이 근무 요청을 보내는 문이다
 * (`tests/e2e/schedule-admin.yaml`의 「근무 요청 보내기」 절).
 */
async function seedAdminRequestSlot(): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  const workerA = await createSignedInUser();
  await submitSeededProfile(workerA, { ...SEEDED_PROFILE, name: "정하윤" });
  await decideBy("approve_member", workerA.profileId);

  const workerB = await createSignedInUser();
  await submitSeededProfile(workerB, { ...SEEDED_PROFILE, name: "오수민" });
  await decideBy("approve_member", workerB.profileId);

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);
    const day = "01";
    const workDate = `${month}-${day}`;

    await createSchedule(admin, monthDate, kstDate(3));
    await openDay(admin, workDate);

    return { month, day, monthLabel: spellMonth(month) };
  });
}

/**
 * 배정 셋이 선 열린 날 하나와, 받아온 공휴일이 심긴 다른 날 하나다
 * (`tests/e2e/schedule-admin.yaml`의 「payroll-adjust」 절).
 *
 * **근무 시간을 10:00–19:00으로 못 박는다.** 조정 시트의 문구가 문안 표 예시와 같은 숫자로
 * 서서, 플로우가 시간을 계산하지 않고 표를 그대로 베낀다.
 *
 * **셋의 포지션을 가른다.** `freeSlotOf`는 점유를 안 보고 그 날의 아무 자리나 줘서 세 번
 * 부르면 같은 자리를 세 번 준다 — `freeSlotOfPosition`으로 안내·스캔·메인을 나눠 집는다.
 */
async function seedPayrollAdjust(): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  const absentee = await createSignedInUser();
  await submitSeededProfile(absentee, { ...SEEDED_PROFILE, name: "정민아" });
  await decideBy("approve_member", absentee.profileId);

  const overtimeWorker = await createSignedInUser();
  await submitSeededProfile(overtimeWorker, {
    ...SEEDED_PROFILE,
    name: "한서준",
  });
  await decideBy("approve_member", overtimeWorker.profileId);

  const rehearsed = await createSignedInUser();
  await submitSeededProfile(rehearsed, { ...SEEDED_PROFILE, name: "유하린" });
  await decideBy("approve_member", rehearsed.profileId);

  // 리허설 자격은 관리자가 주는 행이 유일한 길이다(schedule/design.md 「자격」).
  throwIf(
    (
      await admin.client.rpc("grant_position", {
        p_profile_id: rehearsed.profileId,
        p_position: "리허설",
      })
    ).error,
  );

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);
    const day = "01";
    const workDate = `${month}-${day}`;
    const holidayDay = "05";
    const holidayDate = `${month}-${holidayDay}`;

    await createSchedule(admin, monthDate, kstDate(3));
    await openDay(admin, workDate);
    // 날 상세로 들어가려면 그 날도 열려 있어야 한다.
    await openDay(admin, holidayDate);

    throwIf(
      (
        await admin.client.rpc("set_day_hours", {
          p_work_date: workDate,
          p_starts: "10:00",
          p_ends: "19:00",
        })
      ).error,
    );

    const dayId = await dayIdOf(admin, workDate);

    seedAssignment(
      dayId,
      absentee.profileId,
      "regular",
      await freeSlotOfPosition(admin, dayId, "안내"),
    );
    seedAssignment(
      dayId,
      overtimeWorker.profileId,
      "regular",
      await freeSlotOfPosition(admin, dayId, "스캔"),
      "스캔",
    );
    seedAssignment(
      dayId,
      rehearsed.profileId,
      "regular",
      await freeSlotOfPosition(admin, dayId, "메인"),
      "메인",
    );

    // 정규 배정이 이미 있는 날이라 갈래가 건수로 판정된다
    // (rehearsal_functions.sql의 `internal.rehearsal_kind_of`) — 화면이 부르는 것과 같은
    // 함수를 그대로 쓴다.
    throwIf(
      (
        await rehearsed.client.rpc("add_rehearsal", {
          p_work_date: workDate,
          p_count: 2,
        })
      ).error,
    );

    seedHoliday(holidayDate, "api", "대체공휴일");

    return { month, day, holidayDay };
  });
}

/**
 * 확정된 달의 안내 자리에 내게 온 근무 요청 하나다. 함수(`send_work_request`)가 아니라
 * 직결로 심는 것은 시드가 도는 시점의 스키마에 그 함수가 없을 수도 있어서고, 만들어지는
 * 행의 모양은 함수가 만드는 것과 같다.
 */
async function seedWorkerRequestPending(
  meProfileId: string,
): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);
    const workDate = `${month}-01`;

    await createSchedule(admin, monthDate, kstDate(1));
    await openDay(admin, workDate);
    backdateDeadline(await scheduleIdOf(admin, monthDate), kstDate(-1));
    await confirmSchedule(admin, monthDate);

    const dayId = await dayIdOf(admin, workDate);
    const slotId = await freeSlotOfPosition(admin, dayId, "안내");
    const requestId = seedWorkRequest(slotId, admin.profileId);

    seedRequestCandidate(requestId, meProfileId, "pending");

    return {
      month,
      monthLabel: spellMonth(month),
      myDateLabel: spellWorkDate(workDate),
    };
  });
}

/**
 * 위와 같은데 그 자리를 다른 근무자가 이미 채웠다. 내 갈래는 `pending`으로 남아 있어서
 * 「근무할게요」를 누르는 순간에야 자리가 찼다는 것을 안다 — 늦은 수락이다.
 */
async function seedWorkerRequestClaimed(
  meProfileId: string,
): Promise<SchedulePayload> {
  const admin = await createAdminUser();
  const colleague = await createSignedInUser();

  await submitSeededProfile(colleague, { ...SEEDED_PROFILE, name: "노을" });
  await decideBy("approve_member", colleague.profileId);

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);
    const workDate = `${month}-01`;

    await createSchedule(admin, monthDate, kstDate(1));
    await openDay(admin, workDate);
    backdateDeadline(await scheduleIdOf(admin, monthDate), kstDate(-1));
    await confirmSchedule(admin, monthDate);

    const dayId = await dayIdOf(admin, workDate);
    const slotId = await freeSlotOfPosition(admin, dayId, "안내");
    const requestId = seedWorkRequest(slotId, admin.profileId);

    seedRequestCandidate(requestId, meProfileId, "pending");
    seedAssignment(dayId, colleague.profileId, "regular", slotId);

    return {
      month,
      monthLabel: spellMonth(month),
      slotClaimedLabel: `${formatBareDate(workDate)} 안내 자리는 다른 분이 맡았어요`,
    };
  });
}

/**
 * 판정을 기다리는 근무 취소 요청 하나다. 로그인하는 사람은 관리자고 요청을 낸 사람은
 * 한소민이다 — 승인할 일 목록의 줄 하나가 이 행이다.
 */
async function seedApprovalsCancelPending(): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  const worker = await createSignedInUser();
  await submitSeededProfile(worker, { ...SEEDED_PROFILE, name: "한소민" });
  await decideBy("approve_member", worker.profileId);
  setDisplayName(worker.profileId, "한소민");

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);
    const workDate = `${month}-01`;

    await createSchedule(admin, monthDate, kstDate(1));
    await openDay(admin, workDate);

    const dayId = await dayIdOf(admin, workDate);
    const assignmentId = seedAssignment(
      dayId,
      worker.profileId,
      "regular",
      await freeSlotOfPosition(admin, dayId, "안내"),
    );

    backdateDeadline(await scheduleIdOf(admin, monthDate), kstDate(-1));
    await confirmSchedule(admin, monthDate);

    seedCancelRequest(
      assignmentId,
      worker.profileId,
      "몸이 안 좋아서 못 나가요",
    );

    return {
      month,
      monthLabel: spellMonth(month),
      approvalListTitle: `한소민 · ${formatBareDate(workDate)} 안내`,
      approvalDetailTitle: `한소민 · ${spellWorkDate(workDate)} 안내`,
      approvalConfirmBody: `${formatBareDate(workDate)} 안내 자리가 비고 한소민님에게 알림이 가요`,
      approvalDayAppbar: spellWorkDate(workDate),
    };
  });
}

/**
 * 리허설 자격을 받은 근무자 하나와 이번 달의 두 날이다 — 정규 배정이 있는 날(건수로
 * 넣는다)과 배정이 없는 날(시각으로 넣는다). 계약은 `tests/e2e/rehearsal.yaml`
 * 머리말에 있다.
 *
 * **이번 달을 그대로 쓰는 유일한 상태다.** 배정이 있는 날은 `open_day`가 지난 날짜를
 * 안 받아서 오늘일 수밖에 없고, 오늘이 든 달은 고를 수가 없다. 그래서 다른 상태처럼
 * `withFreshMonth`로 먼 달을 비껴갈 수 없고, 로컬 DB를 안 비운 채 두 번 돌리면 두 번째
 * `create_schedule`이 `already_exists`로 죽는다.
 */
async function seedRehearsalQualified(
  meProfileId: string,
): Promise<SchedulePayload> {
  const admin = await createAdminUser();
  const monthDate = kstMonthStart(0);
  const month = monthDate.slice(0, 7);
  const assignedDate = kstDate(0);
  const freeDate = assignedDate.endsWith("-01") ? `${month}-02` : `${month}-01`;

  const { error } = await admin.client.rpc("grant_position", {
    p_profile_id: meProfileId,
    p_position: "리허설",
  });

  throwIf(error);

  await createSchedule(admin, monthDate, kstDate(3));
  await openDay(admin, assignedDate);

  const dayId = await dayIdOf(admin, assignedDate);
  seedAssignment(dayId, meProfileId, "regular", await freeSlotOf(admin, dayId));

  return {
    month,
    assignedDate,
    freeDate,
    assignedDateLabel: spellWorkDate(assignedDate),
    freeDateLabel: spellWorkDate(freeDate),
  };
}

/**
 * 시급 화면이 필요로 하는 다섯 사람과 기본 시급이다. 계약은 `tests/e2e/wages.yaml`
 * 머리말에 있다 — 이름을 그 파일이 고정으로 단언하므로 여기서도 고정으로 박는다.
 *
 * **기본 시급을 먼저 세우고 승인한다.** `approve_member`가 그 순서에서만 오늘 행
 * (`follows_default = true`)을 같이 넣는다(`approve_wage_row.sql`).
 *
 * 임하은의 지난 세 줄은 RPC로 못 만든다 — `set_wage`가 오늘 날짜만 받는다(PAY-008).
 * `seedWageHistory`가 `backdateDeadline`과 같은 손으로 직접 꽂는다.
 */
async function seedPayrollWages(): Promise<Partial<SchedulePayload>> {
  const admin = await createAdminUser();

  throwIf(
    (await admin.client.rpc("set_default_wage", { p_amount: 11000 })).error,
  );

  for (const name of ["윤소율", "차수아"]) {
    const follower = await createSignedInUser();
    await submitSeededProfile(follower, { ...SEEDED_PROFILE, name });
    await decideBy("approve_member", follower.profileId);
  }

  const historied = await createSignedInUser();
  await submitSeededProfile(historied, { ...SEEDED_PROFILE, name: "임하은" });
  await decideBy("approve_member", historied.profileId);
  seedWageHistory(historied.profileId, [
    { date: "2024-01-01", amount: 9000, followsDefault: false },
    { date: "2024-07-01", amount: 9500, followsDefault: false },
    { date: "2025-01-01", amount: 10000, followsDefault: false },
  ]);

  // 기본(11,000원)보다 높은 15,000원이라야 되돌리기가 값을 내리는 자리가 된다(AC-04).
  const individual = await createSignedInUser();
  await submitSeededProfile(individual, { ...SEEDED_PROFILE, name: "탁현우" });
  await decideBy("approve_member", individual.profileId);
  throwIf(
    (
      await admin.client.rpc("set_wage", {
        p_profile_id: individual.profileId,
        p_amount: 15000,
      })
    ).error,
  );

  const leaver = await createSignedInUser();
  await submitSeededProfile(leaver, { ...SEEDED_PROFILE, name: "노건우" });
  await decideBy("approve_member", leaver.profileId);
  await decideBy("mark_leave", leaver.profileId);

  return {};
}

/**
 * 연 합계를 두 줄로 보여줄 둘째 달을 고른다. 지난달이 1월이면 그 앞엔 같은 해가 없어 다음
 * 달을 쓴다 — 이번 달(+0)은 빈 기간 검증에 쓰려고 비워 둬야 해서 건너뛴다.
 */
function secondMonthOffset(lastMonth: string): number {
  return lastMonth.slice(5, 7) === "01" ? 1 : -2;
}

/** 연 목록의 달 줄 제목이다 — 「10월」. */
function shortMonthLabel(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

/** 어느 달에도 있는 날짜만 쓴다 — 2월이 짧아 28일 뒤는 못 쓴다. */
const PAYROLL_VIEW_STARTS_AT = "10:00:00";

type SeededWorkedDay = {
  workDate: string;
  monthStart: string;
  endsAt: string;
  position: string;
  checkedIn?: boolean;
};

/** 지난 달에 일한 하루다 — 날·자리·배정이 한 짝이고 인증은 부르는 쪽이 고른다. */
async function seedWorkedDay(
  admin: AdminUser,
  me: SignedInUser,
  day: SeededWorkedDay,
): Promise<void> {
  seedPastDay(
    day.workDate,
    day.monthStart,
    PAYROLL_VIEW_STARTS_AT,
    day.endsAt,
    admin.profileId,
  );

  const dayId = await dayIdOf(admin, day.workDate);

  seedAssignment(
    dayId,
    me.profileId,
    "regular",
    seedSlotOfPosition(dayId, day.position),
    day.position,
  );

  if (day.checkedIn === true) {
    seedCheckIn(
      dayId,
      me.profileId,
      kstInstant(day.workDate, PAYROLL_VIEW_STARTS_AT),
    );
  }
}

/**
 * 급여 조회가 보는 지난 달 사흘과 연 합계용 둘째 달 하루다. 계약은 `tests/e2e/payroll.yaml`
 * 머리말의 표에 있다 — 시급 12,000원으로 지난달 150,000원, 연 258,000원이 난다.
 *
 * **이번 달은 일부러 비운다.** 이 화면은 딥링크 인자 없이 언제나 이번 달에서 시작하는데
 * (navigation.md 「경로」) 오늘 막 만든 사람에게 이번 달은 원래 비어 있다 — 그 자연 상태를
 * 빈 기간 검증에 그대로 쓴다.
 *
 * **지난 달에 까는 것은 결근 때문이다.** 결근은 저장하는 배치가 없고 「인증 창이 닫힌 뒤
 * 48시간」을 그때그때 재는 값이라, 먼 미래 달로는 영영 결근이 안 된다. 그래서 `open_day`·
 * `create_schedule` 대신 `seedPastDay`·`seedPastSchedule`이 직접 꽂는다 — 두 RPC 다 지난
 * 날짜를 거절한다.
 *
 * 기본 시급은 `seededUser`가 승인보다 먼저 세우고(PAY-012), 이 함수가 그 승인일과 첫 시급 행을
 * 다시 근무보다 앞 달로 물린다 — 아래 `floorMonth`가 그 자리다.
 */
async function seedPayrollView(
  me: SignedInUser,
): Promise<Partial<SchedulePayload>> {
  const admin = await createAdminUser();

  const lastMonth = kstMonthStart(-1);
  const secondMonth = kstMonthStart(secondMonthOffset(lastMonth));
  const lastMonthKey = lastMonth.slice(0, 7);
  const secondMonthKey = secondMonth.slice(0, 7);

  // 승인과 첫 시급 행을 근무보다 앞으로 물린다. 승인 함수가 넣는 행은 적용일이 오늘이고
  // (PAY-008) 뒤로 가는 화살표의 바닥도 승인된 달이라(PAY-025), 오늘 승인된 채로 두면 지난
  // 달에 닿을 길이 없고 닿아도 그날 시급이 없어 전부 「시급 미정」이 된다.
  const floorMonth = secondMonth < lastMonth ? secondMonth : lastMonth;

  approveProfile(me.userId, kstInstant(floorMonth, "00:00:00"));
  seedWageHistory(me.profileId, [
    { date: floorMonth, amount: PAYROLL_VIEW_WAGE, followsDefault: true },
  ]);

  seedPastSchedule(lastMonth, admin.profileId);
  seedPastSchedule(secondMonth, admin.profileId);

  const overtimeDate = `${lastMonthKey}-05`;
  const absentDate = `${lastMonthKey}-10`;
  const rehearsalOnlyDate = `${lastMonthKey}-15`;
  const secondDate = `${secondMonthKey}-05`;

  await seedWorkedDay(admin, me, {
    workDate: overtimeDate,
    monthStart: lastMonth,
    endsAt: "20:00:00",
    position: "메인",
    checkedIn: true,
  });

  // 인증 행을 안 넣는다 — 그것이 결근의 정체다.
  await seedWorkedDay(admin, me, {
    workDate: absentDate,
    monthStart: lastMonth,
    endsAt: "19:00:00",
    position: "안내",
  });

  await seedWorkedDay(admin, me, {
    workDate: secondDate,
    monthStart: secondMonth,
    endsAt: "19:00:00",
    position: "메인",
    checkedIn: true,
  });

  // 리허설 자격을 준 뒤 본인 세션으로 넣는다 — 관리자에게는 남의 리허설을 넣는 길이 없다
  // (schedule/design.md 「리허설」).
  throwIf(
    (
      await admin.client.rpc("grant_position", {
        p_profile_id: me.profileId,
        p_position: "리허설",
      })
    ).error,
  );
  throwIf(
    (
      await me.client.rpc("add_rehearsal", {
        p_work_date: rehearsalOnlyDate,
        p_starts_at: "14:00:00",
        p_ends_at: "16:00:00",
      })
    ).error,
  );

  return {
    month: lastMonthKey,
    monthLabel: spellMonth(lastMonthKey),
    currentMonthLabel: spellMonth(kstMonthStart(0).slice(0, 7)),
    yearLabel: `${lastMonthKey.slice(0, 4)}년`,
    overtimeDateLabel: spellWorkDate(overtimeDate),
    absentDateLabel: spellWorkDate(absentDate),
    rehearsalOnlyDateLabel: spellWorkDate(rehearsalOnlyDate),
    lastMonthShortLabel: shortMonthLabel(lastMonthKey),
    secondMonthShortLabel: shortMonthLabel(secondMonthKey),
  };
}

/**
 * 관리자 통계가 보는 지난 세 달이다. 계약은 `tests/e2e/admin-stats.yaml` 머리말의 손계산
 * 표에 있다 — 오프셋 -3이 근무·근태 주 데이터, -4가 몫 둘이 0인 달, -5가 근무가 없는 달이자
 * 뒤로 가는 바닥이다.
 *
 * **지난 달이라 RPC로 못 만든다.** `create_schedule`도 `open_day`도 지난 날짜를 거절해서
 * (`date_past`) `seedPastSchedule`·`seedPastDay`가 직접 꽂는다 — 급여 조회 시드와 같은 손이다.
 * 결근과 출근 인정도 진짜로 지나간 날이라야 선다.
 *
 * **확정을 안 채운다.** 이 화면은 확정 여부를 안 보고 배정이 있으면 센다
 * (`docs/3-build/plans/stats-admin.md`의 「착수 판정」).
 *
 * **오프셋 -1·-2와 0은 이미 다른 상태가 쓴다**(`payroll_view`·`rehearsal_qualified`). 한 DB
 * 위에서 플로우가 잇달아 돌 때 겹치지 않을 가장 가까운 구간이 -3·-4·-5다.
 */
async function seedStatsAdminOverview(): Promise<Partial<SchedulePayload>> {
  const admin = await createAdminUser();

  const jointWorker = await approvedWorker("고은채");
  const trainee = await approvedWorker("강태오");
  const absentee = await approvedWorker("윤소현");
  const excused = await approvedWorker("민하율");

  const workMonth = kstMonthStart(-3);
  const secondMonth = kstMonthStart(-4);
  const emptyMonth = kstMonthStart(-5);
  const workMonthKey = workMonth.slice(0, 7);
  const secondMonthKey = secondMonth.slice(0, 7);

  // 겸임 하나·교육 하나와 근태 네 갈래(출근·지각·결근·출근 인정) 각 하나다. 대기실은 아무도
  // 안 서서 「한 달 내내 아무도 안 들어간 포지션」이 그대로 남는다.
  seedPastSchedule(workMonth, admin.profileId);

  const workDay1 = `${workMonthKey}-01`;
  const workDay2 = `${workMonthKey}-02`;
  const workDay3 = `${workMonthKey}-03`;
  const workDay4 = `${workMonthKey}-04`;

  seedPastDay(workDay1, workMonth, "10:00:00", "19:00:00", admin.profileId);
  seedPastDay(workDay2, workMonth, "10:00:00", "16:00:00", admin.profileId);
  seedPastDay(workDay3, workMonth, "10:00:00", "18:00:00", admin.profileId);
  seedPastDay(workDay4, workMonth, "10:00:00", "17:00:00", admin.profileId);

  const workDay1Id = await dayIdOf(admin, workDay1);
  const workDay2Id = await dayIdOf(admin, workDay2);
  const workDay3Id = await dayIdOf(admin, workDay3);
  const workDay4Id = await dayIdOf(admin, workDay4);

  // 겸임 자리 — 「메인」·「드레스」를 합친 슬롯 하나에 한 사람이고 앞 포지션으로 센다.
  seedAssignment(
    workDay1Id,
    jointWorker.profileId,
    "regular",
    seedJointSlot(workDay1Id, ["메인", "드레스"]),
    "메인",
  );
  seedCheckIn(
    workDay1Id,
    jointWorker.profileId,
    kstInstant(workDay1, "09:58:00"),
  );

  // 교육 배정은 자리를 안 먹어 `slot_id`가 없다(schedule.sql의 check 제약).
  seedAssignment(workDay2Id, trainee.profileId, "training", null, "안내");
  seedCheckIn(workDay2Id, trainee.profileId, kstInstant(workDay2, "10:15:00"));

  // 결근 — 인증도 사유도 없다. 지난 달이라 사유 마감(48시간)이 이미 지났다.
  seedAssignment(
    workDay3Id,
    absentee.profileId,
    "regular",
    seedSlotOfPosition(workDay3Id, "스캔"),
    "스캔",
  );

  seedAssignment(
    workDay4Id,
    excused.profileId,
    "regular",
    seedSlotOfPosition(workDay4Id, "매니저"),
    "매니저",
  );
  seedExcuse(workDay4Id, excused.profileId);

  // 결근·출근 인정 두 몫이 0인 달이다 — 범례가 그 둘을 빼는지 여기서 본다.
  seedPastSchedule(secondMonth, admin.profileId);

  const secondDay1 = `${secondMonthKey}-01`;
  const secondDay2 = `${secondMonthKey}-02`;
  const secondDay3 = `${secondMonthKey}-03`;

  seedPastDay(secondDay1, secondMonth, "10:00:00", "18:00:00", admin.profileId);
  seedPastDay(secondDay2, secondMonth, "10:00:00", "18:00:00", admin.profileId);
  seedPastDay(secondDay3, secondMonth, "10:00:00", "19:00:00", admin.profileId);

  const secondDay1Id = await dayIdOf(admin, secondDay1);
  const secondDay2Id = await dayIdOf(admin, secondDay2);
  const secondDay3Id = await dayIdOf(admin, secondDay3);

  seedAssignment(
    secondDay1Id,
    jointWorker.profileId,
    "regular",
    seedSlotOfPosition(secondDay1Id, "메인"),
    "메인",
  );
  seedCheckIn(
    secondDay1Id,
    jointWorker.profileId,
    kstInstant(secondDay1, "09:55:00"),
  );

  seedAssignment(
    secondDay2Id,
    trainee.profileId,
    "regular",
    seedSlotOfPosition(secondDay2Id, "스캔"),
    "스캔",
  );
  seedCheckIn(
    secondDay2Id,
    trainee.profileId,
    kstInstant(secondDay2, "09:50:00"),
  );

  seedAssignment(
    secondDay3Id,
    trainee.profileId,
    "regular",
    seedSlotOfPosition(secondDay3Id, "스캔"),
    "스캔",
  );
  seedCheckIn(
    secondDay3Id,
    trainee.profileId,
    kstInstant(secondDay3, "10:15:00"),
  );

  // 근무표 행만 있고 날이 없다. 세 달 중 가장 이르므로 뒤로 가는 바닥이면서 동시에 빈 상태다.
  seedPastSchedule(emptyMonth, admin.profileId);

  return {
    statsWorkMonthLabel: spellMonth(workMonthKey),
    statsSecondMonthLabel: spellMonth(secondMonthKey),
    statsEmptyMonthLabel: spellMonth(emptyMonth.slice(0, 7)),
  };
}

/**
 * 근무자 통계가 보는 한 달이다. 근태 네 갈래(출근·지각·결근·인정)와 포지션 둘(메인·스캔)이
 * 한 사람에게 붙어, 안 들어간 일곱이 목록에서 빠지는 것과 결근한 날이 급여 보조 줄에서
 * 빠지는 것을 한 달로 같이 본다. 손계산 표는 `tests/e2e/stats.yaml` 머리말이다.
 *
 * **이번 달은 비워 둔다.** 이 화면은 `?month=`을 안 받아 언제나 이번 달에서 열리는데
 * (navigation.md 「경로」) 방금 만든 사람에게 이번 달은 원래 비어 있다 — 그 자연 상태를
 * 빈 상태 검증에 그대로 쓴다(`seedPayrollView`와 같은 손이다).
 *
 * **오프셋 -6이다.** -1·-2는 급여 조회가, -3·-4·-5는 관리자 통계가, 0은 리허설이 이미
 * 쓴다 — 넷과 안 겹치는 가장 가까운 달이다.
 *
 * **시급 행을 그 달 1일자로 직접 꽂는다.** 승인이 넣는 행은 적용일이 오늘이라(PAY-008)
 * 여섯 달 전 근무에 안 닿는다. `set_default_wage`는 안 쓴다 — 이 상태에서 세는 근무가
 * 나 하나뿐이라 개인 이력만으로 충분하다.
 */
async function seedStatsWorkerOverview(
  meProfileId: string,
): Promise<Partial<SchedulePayload>> {
  const admin = await createAdminUser();

  const workMonth = kstMonthStart(-6);
  const workMonthKey = workMonth.slice(0, 7);

  seedWageHistory(meProfileId, [
    { date: workMonth, amount: STATS_WORKER_WAGE, followsDefault: true },
  ]);

  seedPastSchedule(workMonth, admin.profileId);

  const presentDate = `${workMonthKey}-01`;
  const lateDate = `${workMonthKey}-02`;
  const absentDate = `${workMonthKey}-03`;
  const excusedDate = `${workMonthKey}-04`;

  seedPastDay(presentDate, workMonth, "10:00:00", "19:00:00", admin.profileId);
  seedPastDay(lateDate, workMonth, "10:00:00", "16:00:00", admin.profileId);
  seedPastDay(absentDate, workMonth, "10:00:00", "18:00:00", admin.profileId);
  seedPastDay(excusedDate, workMonth, "10:00:00", "18:00:00", admin.profileId);

  const presentDayId = await dayIdOf(admin, presentDate);
  const lateDayId = await dayIdOf(admin, lateDate);
  const absentDayId = await dayIdOf(admin, absentDate);
  const excusedDayId = await dayIdOf(admin, excusedDate);

  seedAssignment(
    presentDayId,
    meProfileId,
    "regular",
    seedSlotOfPosition(presentDayId, "메인"),
    "메인",
  );
  seedCheckIn(presentDayId, meProfileId, kstInstant(presentDate, "09:58:00"));

  seedAssignment(
    lateDayId,
    meProfileId,
    "regular",
    seedSlotOfPosition(lateDayId, "메인"),
    "메인",
  );
  seedCheckIn(lateDayId, meProfileId, kstInstant(lateDate, "10:15:00"));

  // 결근 — 인증도 사유도 없다. 지난 달이라 사유 마감(48시간, ATT-023)이 이미 지났다.
  seedAssignment(
    absentDayId,
    meProfileId,
    "regular",
    seedSlotOfPosition(absentDayId, "스캔"),
    "스캔",
  );

  seedAssignment(
    excusedDayId,
    meProfileId,
    "regular",
    seedSlotOfPosition(excusedDayId, "스캔"),
    "스캔",
  );
  seedExcuse(excusedDayId, meProfileId);

  return {
    statsWorkerMonthLabel: spellMonth(workMonthKey),
    statsWorkerPresentDateLabel: spellWorkDate(presentDate),
    statsWorkerLateDateLabel: spellWorkDate(lateDate),
    statsWorkerAbsentDateLabel: spellWorkDate(absentDate),
    statsWorkerExcusedDateLabel: spellWorkDate(excusedDate),
  };
}

/** 신청을 보내고 관리자가 받는 실제 경로를 그대로 밟는다 — 이름이 명단에 서야 해서다. */
async function approvedWorker(name: string): Promise<SignedInUser> {
  const worker = await createSignedInUser();

  await submitSeededProfile(worker, { ...SEEDED_PROFILE, name });
  await decideBy("approve_member", worker.profileId);

  return worker;
}

const NOTIFICATION_LIST_MANY_COUNT = 55;

/**
 * 알림이 하나 쌓인 근무표 화면이다. 종 아이콘의 점, 목록 줄의 점, 읽으면 둘 다 사라지는
 * 것을 `tests/e2e/notifications.yaml`이 한 여정으로 본다.
 *
 * **근무표는 일부러 안 만든다.** `seedAdminEmptyMonth`와 같은 손이다 — `withFreshMonth`로
 * 고른 달에 아무 것도 안 심으면 그 달은 「근무표를 아직 안 만든 달」로 선다. 이 시나리오가
 * 보는 것은 근무표 내용이 아니라 앱바의 종이라, 근무표 쪽 상태는 무엇이든 상관없이 가장
 * 값싼 상태를 그대로 쓴다.
 *
 * **알림은 `signup_approved` 하나뿐이다.** `payload` 열쇠가 없는 유일한 1차 종류라
 * `seedNotifications`(payload를 늘 `{}`로 고정한다)로도 화면이 낼 문장과 어긋나지 않게
 * 심을 수 있다. 다른 1차 종류는 `work_date` 같은 열쇠가 필요해 이 헬퍼로는 못 심는다.
 *
 * **행 id를 안 돌려준다.** `tests/e2e/scripts/seedSession.js`가 새 필드를 output으로
 * 릴레이하는 자리인데 이 task가 쓸 수 있는 파일은 `tests/e2e/notifications.yaml`과 이
 * 파일 둘뿐이라 그 파일을 못 고친다. 그래서 이 상태는 알림을 한 건만 심어 행이 하나뿐이게
 * 만들고, 줄의 안 읽음 점은 `notifications.yaml`이 id가 아니라 `kind`로 조립한 testID로
 * 잡는다 — 그 파일의 「이 task가 요청하는 testID」참고.
 */
async function seedNotificationList(
  meProfileId: string,
): Promise<Partial<SchedulePayload>> {
  seedNotifications(meProfileId, 1, "signup_approved");

  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow).slice(0, 7);

    return { month };
  });
}

/**
 * 받은 알림이 하나도 없는 사람이다. `seedNotificationList`와 같은 손으로 근무표를 안
 * 만들고, 알림도 하나도 안 심는다 — 종 아이콘에 점이 없고 목록이 빈 상태로 서는 자리다.
 */
async function seedNotificationListEmpty(): Promise<Partial<SchedulePayload>> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow).slice(0, 7);

    return { month };
  });
}

/**
 * 알림이 50건을 넘는 사람이다. 근무표는 필요 없다 — 이 시나리오는 딥링크로 곧장
 * "/notifications"에 들어가 목록만 본다.
 */
async function seedNotificationListMany(
  meProfileId: string,
): Promise<Partial<SchedulePayload>> {
  seedNotifications(meProfileId, NOTIFICATION_LIST_MANY_COUNT);

  return {};
}

export type SeedRequest = {
  name?: string;
  month?: string;
  day?: string;
};

async function schedulePayloadOf(
  state: SeedState,
  user: SignedInUser,
  asked: SeedRequest,
): Promise<Partial<SchedulePayload>> {
  const profileId = user.profileId;

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

  if (state === ASSIGN_DAY) {
    return seedAssignDay();
  }

  if (state === ADMIN_REQUEST_SLOT) {
    return seedAdminRequestSlot();
  }

  if (state === WORKER_REQUEST_PENDING) {
    return seedWorkerRequestPending(profileId);
  }

  if (state === WORKER_REQUEST_CLAIMED) {
    return seedWorkerRequestClaimed(profileId);
  }

  if (state === APPROVALS_CANCEL_PENDING) {
    return seedApprovalsCancelPending();
  }

  if (state === REHEARSAL_QUALIFIED) {
    return seedRehearsalQualified(profileId);
  }

  if (state === PAYROLL_WAGES) {
    return seedPayrollWages();
  }

  if (state === PAYROLL_ADJUST) {
    return seedPayrollAdjust();
  }

  if (state === PAYROLL_VIEW) {
    return seedPayrollView(user);
  }

  if (state === STATS_ADMIN_OVERVIEW) {
    return seedStatsAdminOverview();
  }

  if (state === STATS_WORKER_OVERVIEW) {
    return seedStatsWorkerOverview(profileId);
  }

  if (state === NOTIFICATION_LIST) {
    return seedNotificationList(profileId);
  }

  if (state === NOTIFICATION_LIST_EMPTY) {
    return seedNotificationListEmpty();
  }

  if (state === NOTIFICATION_LIST_MANY) {
    return seedNotificationListMany(profileId);
  }

  // 리허설을 다 넣은 뒤에 퇴사시킨다 — `add_rehearsal`이 첫 줄에서 보는 `is_approved()`가
  // 「승인됨이고 미퇴사」라(20260825162027_profiles.sql) 순서를 뒤집으면 not_allowed다.
  if (state === PAYROLL_VIEW_LEFT) {
    const payload = await seedPayrollView(user);

    await decideBy("mark_leave", user.profileId);

    return payload;
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
    ...(await schedulePayloadOf(state, user, asked)),
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
