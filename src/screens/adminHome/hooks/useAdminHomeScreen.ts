import { usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  ADMIN_APPROVALS_PATH,
  ADMIN_MEMBERS_PATH,
  ADMIN_MEMBERS_PENDING_PATH,
  ADMIN_QR_PATH,
  ADMIN_SCHEDULE_PATH,
  ADMIN_STATS_PATH,
  ADMIN_WAGES_PATH,
  NOTIFICATIONS_PATH,
  WORKER_HOME_PATH,
} from "@/shared/consts/navigation.const";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { miniViewLoads } from "@/shared/model/miniViewDensity.policy";
import { tileMonth } from "@/shared/model/tileMonth.policy";
import { clockOf, spellDate } from "@/shared/utils/kstDate";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";
import type { HallSlot } from "@/entities/hall/model/hall.type";
import { useHallDefaultsQuery } from "@/entities/hall/services/useHallDefaultsQuery";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { useUnreadCountQuery } from "@/entities/notification/services/useUnreadCountQuery";
import { liveAssignmentCount } from "@/entities/schedule/api/getMonthSchedule.api";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import { useMonthWindowQuery } from "@/entities/schedule/services/useMonthWindowQuery";
import { useOpenSlotsQuery } from "@/entities/schedule/services/useOpenSlotsQuery";
import { usePendingApprovalsQuery } from "@/entities/workRequest/services/usePendingApprovalsQuery";
import { ADMIN_HOME_COPY } from "@/screens/adminHome/consts/adminHome.const";
import {
  homeTileSummary,
  monthName,
} from "@/screens/adminHome/model/homeTileSummary.policy";
import {
  todayBandShares,
  todayStatus,
  type TodayBandShare,
  type TodayStatus,
} from "@/screens/adminHome/model/todayStatus.policy";
import {
  vacancyCardTitle,
  vacancyCards,
  vacancyDaysLeftLine,
  vacancyDaysOf,
} from "@/screens/adminHome/model/vacancyCards.policy";
import { approvalsLine } from "@/screens/adminHome/utils/approvalsLine.utils";

export type AdminHomeVacancyCard = {
  workDate: string;
  title: string;
  daysLeftLine: string;
  press: () => void;
};

export type AdminHomeSheet = {
  starts: string;
  ends: string;
};

export type AdminHomeScreenController = {
  monthLabel: string;
  tileMonth: string;
  status: TodayStatus;
  todayLabel: string;
  bandShares: TodayBandShare[];
  summary: string;
  cards: AdminHomeVacancyCard[];
  miniYear: number;
  miniMonth: number;
  miniToday: Date;
  loads: Record<number, { load: number }>;
  defaultsValue: string | undefined;
  approvalsTitle: string;
  pendingValue: string | undefined;
  sheet: AdminHomeSheet | null;
  slots: HallSlot[];
  unread: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  goToday: () => void;
  goMonth: () => void;
  goTileMonth: () => void;
  goNotifications: () => void;
  goWorkerHome: () => void;
  goApprovals: () => void;
  goPending: () => void;
  goMembers: () => void;
  goWages: () => void;
  goQr: () => void;
  goStats: () => void;
};

const NO_SLOTS: HallSlot[] = [];

export function useAdminHomeScreen(): AdminHomeScreenController {
  const router = useRouter();
  const pathname = usePathname();
  const [sheet, setSheet] = useState<AdminHomeSheet | null>(null);

  const today = kstToday();
  const month = today.slice(0, 7);
  const nowMs = useServerNow();

  const unreadCount = useUnreadCountQuery(supabase);
  const { data: schedule } = useMonthWindowQuery(supabase, month);
  const { data: days } = useMonthScheduleQuery(supabase, month);
  const { data: openSlots } = useOpenSlotsQuery(supabase, month);
  const { data: defaults } = useHallDefaultsQuery(supabase);
  const { data: pending } = useMembersQuery(supabase, "pending");
  const { data: approvals } = usePendingApprovalsQuery(supabase);

  const tiled = tileMonth({
    todayMonth: month,
    todayMonthConfirmed: schedule?.confirmedAt != null,
  });

  const { data: tileSchedule } = useMonthWindowQuery(supabase, tiled);
  const { data: tileDays } = useMonthScheduleQuery(supabase, tiled);
  const { data: tileSlots } = useOpenSlotsQuery(supabase, tiled);

  const closeSheet = useCallback(() => {
    setSheet(null);
  }, []);

  const goMonthOf = useCallback(
    (asked: string) => router.push(`${ADMIN_SCHEDULE_PATH}?month=${asked}`),
    [router],
  );

  const goDay = useCallback(
    (date: string) => router.push(`${ADMIN_SCHEDULE_PATH}?date=${date}`),
    [router],
  );

  const openDays = days ?? [];
  const confirmed = schedule?.confirmedAt != null;
  const tileVacancies = tileSlots ?? [];

  const summary = homeTileSummary(
    tileSchedule == null
      ? { state: "not_created", month: tiled }
      : tileSchedule.confirmedAt != null
        ? {
            state: "confirmed",
            month: tiled,
            vacancyCount: tileVacancies.length,
          }
        : {
            state: "in_progress",
            month: tiled,
            openDays: (tileDays ?? []).length,
            vacancyCount: tileVacancies.length,
          },
  );

  const todayDay = openDays.find((day) => day.workDate === today) ?? null;

  const status = todayStatus({
    isConfirmed: confirmed,
    assignedCount: todayDay === null ? 0 : liveAssignmentCount(todayDay),
    checkedInCount: todayDay?.checkIns.length ?? 0,
  });

  const cards = useMemo(
    () =>
      confirmed
        ? vacancyCards({
            days: vacancyDaysOf(openSlots ?? []),
            now: new Date(nowMs).toISOString(),
          }).map((card) => ({
            workDate: card.workDate,
            title: vacancyCardTitle(card),
            daysLeftLine: vacancyDaysLeftLine(card.daysLeft),
            press: () => goDay(card.workDate),
          }))
        : [],
    [confirmed, openSlots, nowMs, goDay],
  );

  const loads = useMemo(
    () =>
      miniViewLoads(
        openDays.map((day) => ({
          workDate: day.workDate,
          assignedCount: liveAssignmentCount(day),
        })),
      ),
    [openDays],
  );

  return {
    monthLabel: monthName(month),
    tileMonth: tiled,
    status,
    todayLabel: spellDate(today),
    bandShares:
      status.kind === "value"
        ? todayBandShares(status.checkedInCount, status.notCheckedInCount)
        : [],
    summary,
    cards,
    miniYear: Number(month.slice(0, 4)),
    miniMonth: Number(month.slice(5, 7)),
    miniToday: new Date(nowMs),
    loads,
    defaultsValue:
      defaults === undefined
        ? undefined
        : `${clockOf(defaults.starts)}–${clockOf(defaults.ends)}`,
    approvalsTitle: approvalsLine(approvals?.length ?? 0),
    pendingValue:
      pending === undefined
        ? undefined
        : `${pending.length}${ADMIN_HOME_COPY.peopleSuffix}`,
    sheet,
    slots: defaults?.slots ?? NO_SLOTS,
    unread: (unreadCount.data ?? 0) > 0,
    openSheet: () => {
      if (defaults === undefined) {
        return;
      }

      setSheet({
        starts: clockOf(defaults.starts),
        ends: clockOf(defaults.ends),
      });
    },
    closeSheet,
    goToday: () => goDay(today),
    goMonth: () => goMonthOf(month),
    goTileMonth: () => goMonthOf(tiled),
    goNotifications: () =>
      router.push(`${NOTIFICATIONS_PATH}?from=${pathname}`),
    goWorkerHome: () => router.push(WORKER_HOME_PATH),
    goApprovals: () => router.push(ADMIN_APPROVALS_PATH),
    goPending: () => router.push(ADMIN_MEMBERS_PENDING_PATH),
    goMembers: () => router.push(ADMIN_MEMBERS_PATH),
    goWages: () => router.push(ADMIN_WAGES_PATH),
    goQr: () => router.push(ADMIN_QR_PATH),
    goStats: () => router.push(ADMIN_STATS_PATH),
  };
}
