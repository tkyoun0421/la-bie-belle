import { useCallback, useEffect, useMemo, useState } from "react";
import type { DB } from "@/shared/api/database";
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

/**
 * 관리자가 관리자 모드에서 처음 보는 허브의 controller다. 정본은
 * `docs/2-design/system/screens/adminHome.md`고 완료 조건은
 * `docs/2-design/spec/schedule-admin.md`의 AC-01이다.
 *
 * **타일만 다른 달을 말할 수 있다.** 오늘이 든 달이 확정됐으면 타일은 다음 달을 읽고
 * 눌렀을 때 그 달이 열린다 — 그래서 같은 질의 셋을 달 둘로 던지는 가름이 이 자리에 산다.
 * 오늘 현황·빈 자리 카드·미니뷰는 늘 오늘이 든 달이다.
 *
 * **「지금」을 서버 시계에서 읽는다.** 빈 자리 카드의 남은 날과 미니뷰의 오늘 표시가 둘 다
 * 지금에 달려 있어, 기기 시계가 하루 밀린 기기에서는 어제 카드가 선다.
 *
 * **시트의 적는 값도 여기 있다.** 적은 것이 그대로 보내질 값이라 화면 것이 아니고, 보내기가
 * 넘어지면 시트가 열린 채로 그 값이 남아야 한다.
 *
 * **보낼 데는 안 든다.** 종과 모드 바꾸기와 줄마다의 이동은 `.tsx`가 쥔다 — 이 자리가 내는
 * 것은 그릴 값과 「안 읽은 것이 있나」다.
 */

/** 빈 자리 카드 한 장이 그릴 글자다 — 셈도 꼴도 여기서 끝난다. */
export type AdminHomeVacancyCard = {
  workDate: string;
  title: string;
  daysLeftLine: string;
};

/** 기본값 시트가 적고 있는 값이다 — 열려 있지 않으면 `null`이다. */
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

/**
 * `"10:00:00"`에서 초를 뗀다.
 *
 * **같은 손이 다른 열에도 있다.** `scheduleAdmin`·`scheduleWorker`·`approvals`·
 * `payrollCompute`가 저마다 `.slice(0, 5)`를 적고 있어 접는 것은 AC-13이 받는다 — 지금
 * 여기 두는 것은 이 파일 안의 세 번을 한 번으로 줄이기 위해서다.
 */
function clockLabel(clock: string): string {
  return clock.slice(0, 5);
}

export function useAdminHomeScreen(client: DB): AdminHomeScreenController {
  const [sheet, setSheet] = useState<AdminHomeSheet | null>(null);

  const today = kstToday();
  const month = today.slice(0, 7);
  const clockOffset = serverClockStore((at) => at.offset);

  const unreadCount = useUnreadCountQuery(client);
  const { data: schedule } = useMonthWindowQuery(client, month);
  const { data: days } = useMonthScheduleQuery(client, month);
  const { data: openSlots } = useOpenSlotsQuery(client, month);
  const { data: defaults } = useHallDefaultsQuery(client);
  const { data: pending } = useMembersQuery(client, "pending");
  const { data: approvals } = usePendingApprovalsQuery(client);

  const tiled = tileMonth({
    todayMonth: month,
    todayMonthConfirmed: schedule?.confirmedAt != null,
  });

  const { data: tileSchedule } = useMonthWindowQuery(client, tiled);
  const { data: tileDays } = useMonthScheduleQuery(client, tiled);
  const { data: tileSlots } = useOpenSlotsQuery(client, tiled);

  const {
    mutate: sendDefaults,
    isPending: saving,
    isSuccess: saved,
    isError: saveFailed,
    reset: resetSave,
  } = useSetHallDefaultsMutation(client);

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
        : `${clockLabel(defaults.default_starts)}–${clockLabel(defaults.default_ends)}`,
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
        starts: clockLabel(defaults.default_starts),
        ends: clockLabel(defaults.default_ends),
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
        slots: defaults.default_slots,
        starts: sheet.starts,
        ends: sheet.ends,
      });
    },
  };
}
