import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";
import { useHallDefaultsQuery } from "@/entities/hall/services/useHallDefaultsQuery";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { useUnreadCountQuery } from "@/entities/notification/services/useUnreadCountQuery";
import { liveAssignmentCount } from "@/entities/schedule/api/getMonthSchedule.api";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import { useMonthWindowQuery } from "@/entities/schedule/services/useMonthWindowQuery";
import { useOpenSlotsQuery } from "@/entities/schedule/services/useOpenSlotsQuery";
import { usePendingApprovalsQuery } from "@/entities/workRequest/services/usePendingApprovalsQuery";
import { useSetHallDefaultsMutation } from "@/features/hallDefaults/services/useSetHallDefaultsMutation";
import { ADMIN_HOME_COPY } from "@/screens/adminHome/consts/adminHome.const";
import {
  homeTileSummary,
  monthName,
} from "@/screens/adminHome/model/homeTileSummary.policy";
import { miniViewLoads } from "@/screens/adminHome/model/miniViewDensity.policy";
import { tileMonth } from "@/screens/adminHome/model/tileMonth.policy";
import {
  spellDate,
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
};

export type AdminHomeSheet = {
  starts: string;
  ends: string;
};

export type AdminHomeScreenController = {
  today: string;
  month: string;
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
  saving: boolean;
  saveFailed: boolean;
  unread: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  writeStarts: (typed: string) => void;
  writeEnds: (typed: string) => void;
  saveDefaults: () => void;
};

function clockLabel(clock: string): string {
  return clock.slice(0, 5);
}

export function useAdminHomeScreen(): AdminHomeScreenController {
  const [sheet, setSheet] = useState<AdminHomeSheet | null>(null);

  const today = kstToday();
  const month = today.slice(0, 7);
  const clockOffset = serverClockStore((at) => at.offset);

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

  const {
    mutate: sendDefaults,
    isPending: saving,
    isSuccess: saved,
    isError: saveFailed,
    reset: resetSave,
  } = useSetHallDefaultsMutation(supabase);

  const closeSheet = useCallback(() => {
    setSheet(null);
    resetSave();
  }, [resetSave]);

  useEffect(() => {
    if (saved) {
      closeSheet();
    }
  }, [saved, closeSheet]);

  const nowMs = nowWithOffset(Date.now(), clockOffset);

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

  const todayDay = openDays.find((day) => day.work_date === today) ?? null;

  const status = todayStatus({
    isConfirmed: confirmed,
    assignedCount: todayDay === null ? 0 : liveAssignmentCount(todayDay),
    checkedInCount: todayDay?.check_ins.length ?? 0,
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
          }))
        : [],
    [confirmed, openSlots, nowMs],
  );

  const loads = useMemo(
    () =>
      miniViewLoads(
        openDays.map((day) => ({
          workDate: day.work_date,
          assignedCount: liveAssignmentCount(day),
        })),
      ),
    [openDays],
  );

  return {
    today,
    month,
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
        : `${clockLabel(defaults.starts)}–${clockLabel(defaults.ends)}`,
    approvalsTitle: approvalsLine(approvals?.length ?? 0),
    pendingValue:
      pending === undefined
        ? undefined
        : `${pending.length}${ADMIN_HOME_COPY.peopleSuffix}`,
    sheet,
    saving,
    saveFailed,
    unread: (unreadCount.data ?? 0) > 0,
    openSheet: () => {
      if (defaults === undefined) {
        return;
      }

      setSheet({
        starts: clockLabel(defaults.starts),
        ends: clockLabel(defaults.ends),
      });
    },
    closeSheet,
    writeStarts: (typed) =>
      setSheet((open) => (open === null ? null : { ...open, starts: typed })),
    writeEnds: (typed) =>
      setSheet((open) => (open === null ? null : { ...open, ends: typed })),
    saveDefaults: () => {
      if (sheet === null || defaults === undefined) {
        return;
      }

      sendDefaults({
        slots: defaults.slots,
        starts: sheet.starts,
        ends: sheet.ends,
      });
    },
  };
}
