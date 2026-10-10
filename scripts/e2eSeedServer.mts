import { createServer, type IncomingMessage, type Server } from "node:http";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { spellMonth } from "@/shared/utils/kstDate";
import { spellWorkDate } from "@/entities/schedule/utils/agendaRow.utils";
import { formatBareDate } from "@/entities/schedule/utils/formatScheduleDate.utils";
import { spellDeadline } from "@/screens/scheduleWorker/model/monthState.policy";
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

const STATS_WORKER_WAGE = 12000;

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

  if (state === "approved") {
    await decideBy("approve_member", user.profileId);
  }

  if (state === "rejected") {
    await decideBy("reject_member", user.profileId);
  }

  if (state === "blocked") {
    await decideBy("block_member", user.profileId);
  }

  if (state === "left") {
    await decideBy("approve_member", user.profileId);
    await decideBy("mark_leave", user.profileId);
  }

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

async function seedAdminApplications(): Promise<SchedulePayload> {
  const admin = await createAdminUser();

  return withFreshMonth(async (monthsFromNow) => {
    const monthDate = kstMonthStart(monthsFromNow);
    const month = monthDate.slice(0, 7);

    await createSchedule(admin, monthDate, kstDate(3));

    return { month, monthLabel: spellMonth(month) };
  });
}

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

function secondMonthOffset(lastMonth: string): number {
  return lastMonth.slice(5, 7) === "01" ? 1 : -2;
}

function shortMonthLabel(month: string): string {
  return `${Number(month.slice(5, 7))}월`;
}

const PAYROLL_VIEW_STARTS_AT = "10:00:00";

type SeededWorkedDay = {
  workDate: string;
  monthStart: string;
  endsAt: string;
  position: string;
  checkedIn?: boolean;
};

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

async function seedPayrollView(
  me: SignedInUser,
): Promise<Partial<SchedulePayload>> {
  const admin = await createAdminUser();

  const lastMonth = kstMonthStart(-1);
  const secondMonth = kstMonthStart(secondMonthOffset(lastMonth));
  const lastMonthKey = lastMonth.slice(0, 7);
  const secondMonthKey = secondMonth.slice(0, 7);

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

  seedAssignment(workDay2Id, trainee.profileId, "training", null, "안내");
  seedCheckIn(workDay2Id, trainee.profileId, kstInstant(workDay2, "10:15:00"));

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

  seedPastSchedule(emptyMonth, admin.profileId);

  return {
    statsWorkMonthLabel: spellMonth(workMonthKey),
    statsSecondMonthLabel: spellMonth(secondMonthKey),
    statsEmptyMonthLabel: spellMonth(emptyMonth.slice(0, 7)),
  };
}

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

async function approvedWorker(name: string): Promise<SignedInUser> {
  const worker = await createSignedInUser();

  await submitSeededProfile(worker, { ...SEEDED_PROFILE, name });
  await decideBy("approve_member", worker.profileId);

  return worker;
}

const NOTIFICATION_LIST_MANY_COUNT = 55;

async function seedNotificationList(
  meProfileId: string,
): Promise<Partial<SchedulePayload>> {
  seedNotifications(meProfileId, 1, "signup_approved");

  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow).slice(0, 7);

    return { month };
  });
}

async function seedNotificationListEmpty(): Promise<Partial<SchedulePayload>> {
  return withFreshMonth(async (monthsFromNow) => {
    const month = kstMonthStart(monthsFromNow).slice(0, 7);

    return { month };
  });
}

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
