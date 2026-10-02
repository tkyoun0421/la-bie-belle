import { useCallback, useEffect, useState } from "react";
import type { DB } from "@/shared/api/database";
import type { ScheduleDayCellState } from "@/shared/ui/ScheduleDayCell";
import { useMonthAvailabilitiesQuery } from "@/entities/availability/services/useMonthAvailabilitiesQuery";
import { nowWithOffset } from "@/entities/clock/model/serverClock.policy";
import { serverClockStore } from "@/entities/clock/stores/clock.store";

import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { useQualificationsQuery } from "@/entities/member/services/useQualificationsQuery";
import { usePayrollMonthsQuery } from "@/entities/payroll/services/usePayrollMonthsQuery";
import type { RehearsalWithName } from "@/entities/rehearsal/api/rehearsal.dto";
import { useAllRehearsalsQuery } from "@/entities/rehearsal/services/useAllRehearsalsQuery";
import { liveAssignmentCount } from "@/entities/schedule/api/getMonthSchedule.api";
import type { OpenSlot } from "@/entities/schedule/api/schedule.dto";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import { useMonthWindowQuery } from "@/entities/schedule/services/useMonthWindowQuery";
import { useOpenSlotsQuery } from "@/entities/schedule/services/useOpenSlotsQuery";
import { useSlotRequestsQuery } from "@/entities/workRequest/services/useSlotRequestsQuery";
import { useSetAdjustmentMutation } from "@/features/adjustment/services/useSetAdjustmentMutation";
import { useSetApplicationDeadlineMutation } from "@/features/availabilitySubmit/services/useSetApplicationDeadlineMutation";
import { useSetHolidayMutation } from "@/features/holiday/services/useSetHolidayMutation";
import { useGrantPositionMutation } from "@/features/qualificationGrant/services/useGrantPositionMutation";
import type { AddAssignmentInput } from "@/features/scheduleAssign/api/addAssignment.api";
import { useAddAssignmentMutation } from "@/features/scheduleAssign/services/useAddAssignmentMutation";
import { useRemoveAssignmentMutation } from "@/features/scheduleAssign/services/useRemoveAssignmentMutation";
import { useConfirmScheduleMutation } from "@/features/scheduleConfirm/services/useConfirmScheduleMutation";
import { useForceChangeMutation } from "@/features/scheduleConfirm/services/useForceChangeMutation";
import { useCloseDayMutation } from "@/features/scheduleDay/services/useCloseDayMutation";
import { useCreateScheduleMutation } from "@/features/scheduleDay/services/useCreateScheduleMutation";
import { useOpenDayMutation } from "@/features/scheduleDay/services/useOpenDayMutation";
import { useSetDayHoursMutation } from "@/features/scheduleDay/services/useSetDayHoursMutation";
import { useAddSlotMutation } from "@/features/scheduleSlot/services/useAddSlotMutation";
import { useMergeSlotsMutation } from "@/features/scheduleSlot/services/useMergeSlotsMutation";
import { useRemoveSlotMutation } from "@/features/scheduleSlot/services/useRemoveSlotMutation";
import { useSplitSlotMutation } from "@/features/scheduleSlot/services/useSplitSlotMutation";
import { useSendWorkRequestMutation } from "@/features/workRequest/services/useSendWorkRequestMutation";
import {
  ORIGIN_APPROVALS,
  SCHEDULE_ADMIN_COPY,
} from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import {
  adminCalendarDayState,
  confirmedVacancyCount,
} from "@/screens/scheduleAdmin/model/adminCalendarDayState.policy";
import {
  confirmAffordance,
  confirmUnlockLine,
} from "@/screens/scheduleAdmin/model/confirmAffordance.policy";
import { dayConfirmGate } from "@/screens/scheduleAdmin/model/confirmGate.policy";
import type { DayDetailInput } from "@/screens/scheduleAdmin/model/dayDetail.type";
import { isDayHoursSaveEnabled } from "@/screens/scheduleAdmin/model/dayHoursForm.policy";
import {
  isMonthFullyPast,
  shiftMonth,
} from "@/screens/scheduleAdmin/model/monthEmptyState.policy";
import {
  isSelectableForOpening,
  openDaysButtonLabel,
  openDaysFailureToast,
} from "@/screens/scheduleAdmin/model/openModeSelection.policy";

import { deadlineLine } from "@/screens/scheduleAdmin/utils/deadlineLine.utils";
import {
  confirmedLine,
  formatMonthName,
  formatMonthTitle,
  kstDateOf,
} from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";
import { countOpenSlotsByDate } from "@/screens/scheduleAdmin/utils/groupOpenSlots.utils";

/**
 * 관리자가 근무표를 짜는 화면의 controller다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`고 완료 조건은
 * `docs/2-design/spec/schedule-admin.md`다.
 *
 * **한 라우트가 달력과 날 상세를 둘 다 든다.** `?date=`가 있으면 그 날의 상세고 없으면
 * 달력이다 — 읽는 질의가 같은 아홉이라 훅이 두 갈래로 안 갈린다. 날 상세가 쓰는 네 묶음을
 * 여기서 그 날 것만 걸러 넘긴다.
 *
 * **날 열기 모드의 부분 실패가 이 자리에 산다.** 여는 함수가 날 하나를 받아서
 * (`docs/2-design/modules/schedule/design.md`의 「날 열기·닫기」) 실패한 날만 다시 고를 수
 * 있게 남기고 모드를 안 푼다 — 다시 고를 자리가 있어야 해서다.
 *
 * **시트 열림이 통신에 매여 있다.** 만들기·마감일·근무 시간은 성공하면 저절로 닫히고 훅까지
 * 비운다. 안 비우면 같은 시트를 다시 열었을 때 지난 성공이 그대로 남아 열자마자 닫힌다.
 * 확정 시트만 열린 채로 「끝났어요」를 말하고 닫는 손이 따로다.
 *
 * **「지금」을 서버 시계에서 읽는다.** 확정 잠김·열 수 있는 날·전부 지난 달이 전부 그 하나에
 * 걸려 있어, 기기 시계가 하루 밀린 기기에서는 셋이 같이 어긋난다.
 *
 * **보낼 데는 안 든다.** 앱바 뒤로와 신청 모아보기와 날 상세의 돌아가기는 `.tsx`가 쥔다 —
 * `?from=`이 가리키는 곳으로 돌아가는 것은 이동이고, 그 자리에서 띄울 토스트만 여기 있다.
 */

export type ScheduleAdminListState = "loading" | "missing" | "calendar";

export type ScheduleAdminToast = { kind: "info" | "success"; message: string };

/** 달력 칸 하나가 묻는 것들이다 — 판정은 전부 `model/`에서 끝나 화면은 답만 받는다. */
export type ScheduleAdminCalendar = {
  isToday: (date: string) => boolean;
  stateOf: (date: string) => ScheduleDayCellState;
  canPress: (date: string) => boolean;
  press: (date: string) => void;
  applicationCountOf: (date: string) => number;
  vacancyCountOf: (date: string) => number | null;
};

/**
 * 서 있는 시트 하나다. 다섯이 한 자리를 나눠 쓰는 것은 동시에 둘이 서는 길이 없어서고,
 * 열림과 보내는 중과 실패가 한 덩이로 와야 화면이 셋을 따로 안 맞춘다.
 */
export type ScheduleAdminSheet =
  | {
      kind: "create";
      /** 적고 있는 마감일이다 — 보낼 값이라 화면 것이 아니다. */
      deadline: string;
      canSave: boolean;
      saving: boolean;
      failed: boolean;
    }
  | { kind: "deadline"; deadline: string; saving: boolean; failed: boolean }
  | {
      kind: "confirm";
      openSlots: readonly OpenSlot[];
      notifiedCount: number;
      confirming: boolean;
      done: boolean;
      failed: boolean;
    }
  | {
      kind: "hours";
      /** 적고 있는 출근·퇴근 시각이다. 열 때 그 날 값으로 깔린다. */
      starts: string;
      ends: string;
      canSave: boolean;
      saving: boolean;
      failed: boolean;
    }
  | {
      kind: "close";
      workDate: string;
      assignmentCount: number;
      closing: boolean;
    };

export type ScheduleAdminScreenParams = {
  month?: string;
  date?: string;
  from?: string;
};

export type ScheduleAdminScreenController = {
  month: string;
  monthTitle: string;
  /** 시트의 날짜 고르기가 아래끝으로 쓰는 KST 오늘이다 — 지난 날을 마감으로 못 잡는다. */
  today: string;
  listState: ScheduleAdminListState;
  confirmed: boolean;
  canPickDays: boolean;
  emptyTitle: string;
  canCreate: boolean;
  createHint: string;
  createLabel: string;
  noticeLine: string | null;
  showAllClosedHint: boolean;
  showApplications: boolean;
  applicationsTitle: string;
  calendar: ScheduleAdminCalendar;
  picking: boolean;
  pickedCount: number;
  opening: boolean;
  canOpenDays: boolean;
  openDaysLabel: string;
  startPicking: () => void;
  stopPicking: () => void;
  openPickedDays: () => Promise<void>;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  showConfirmCta: boolean;
  confirmLocked: boolean;
  confirmUnlockLine: string | null;
  confirmLabel: string;
  openCreateSheet: () => void;
  openDeadlineSheet: () => void;
  openConfirmSheet: () => void;
  sheet: ScheduleAdminSheet | null;
  closeSheet: () => void;
  writeCreateDeadline: (typed: string) => void;
  createSchedule: () => void;
  saveDeadline: (deadline: string) => void;
  confirmMonth: () => void;
  writeHoursStarts: (typed: string) => void;
  writeHoursEnds: (typed: string) => void;
  saveHours: () => void;
  closeDay: () => void;
  toast: ScheduleAdminToast | null;
  dismissToast: () => void;
  day: DayDetailInput | null;
  leaveDay: () => void;
};

/**
 * 서 있는 시트와 그 시트가 적고 있는 값이다. 적은 값이 시트와 한 덩이인 것은 닫으면 같이
 * 사라져야 해서고, 시트마다 따로 두면 닫는 손이 비울 것을 하나씩 기억해야 한다.
 */
type SheetState =
  | { kind: "create"; deadline: string }
  | { kind: "deadline" }
  | { kind: "confirm" }
  | { kind: "hours"; starts: string; ends: string }
  | { kind: "close" };

/** `"10:00:00"`에서 초를 뗀다 — 시트가 적는 값은 분까지다. */
function clockLabel(clock: string): string {
  return clock.slice(0, 5);
}

/**
 * 보내기가 끝나면 시트를 닫고 훅을 비운다. 안 비우면 같은 시트를 다시 열었을 때 지난 성공이
 * 그대로 남아 열자마자 닫힌다.
 */
function useCloseSheetOnSuccess(
  succeeded: boolean,
  reset: () => void,
  leave: () => void,
) {
  useEffect(() => {
    if (succeeded) {
      leave();
      reset();
    }
  }, [succeeded, reset, leave]);
}

export function useScheduleAdminScreen(
  client: DB,
  { month: monthParam, date: dateParam, from }: ScheduleAdminScreenParams,
): ScheduleAdminScreenController {
  const clockOffset = serverClockStore((at) => at.offset);
  const nowMs = nowWithOffset(Date.now(), clockOffset);
  const now = new Date(nowMs).toISOString();
  const today = kstDateOf(now);

  const [month, setMonth] = useState(
    monthParam ?? dateParam?.slice(0, 7) ?? today.slice(0, 7),
  );
  const [openDate, setOpenDate] = useState<string | null>(dateParam ?? null);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [sheetState, setSheetState] = useState<SheetState | null>(null);
  const [toast, setToast] = useState<ScheduleAdminToast | null>(null);

  const { data: schedule, isLoading: loadingWindow } = useMonthWindowQuery(
    client,
    month,
  );
  const { data: days, refetch: reloadDays } = useMonthScheduleQuery(
    client,
    month,
  );
  const { data: openSlots } = useOpenSlotsQuery(client, month);
  const { data: availabilities } = useMonthAvailabilitiesQuery(client, month);
  const { data: activeMembers } = useMembersQuery(client, "active");
  const { data: qualifications } = useQualificationsQuery(client);
  const { data: slotRequests } = useSlotRequestsQuery(client, month);
  const { data: payroll } = usePayrollMonthsQuery(client, [month]);
  const { data: rehearsals } = useAllRehearsalsQuery(client, month);

  const create = useCreateScheduleMutation(client);
  const changeDeadline = useSetApplicationDeadlineMutation(client);
  const open = useOpenDayMutation(client);
  const close = useCloseDayMutation(client);
  const setHours = useSetDayHoursMutation(client);
  const confirm = useConfirmScheduleMutation(client);
  const addSlot = useAddSlotMutation(client);
  const removeSlot = useRemoveSlotMutation(client);
  const mergeSlots = useMergeSlotsMutation(client);
  const splitSlot = useSplitSlotMutation(client);
  const addAssignment = useAddAssignmentMutation(client);
  const removeAssignment = useRemoveAssignmentMutation(client);
  const forceChange = useForceChangeMutation(client);
  const grantPosition = useGrantPositionMutation(client);
  const sendWorkRequest = useSendWorkRequestMutation(client);
  const setHoliday = useSetHolidayMutation(client);
  const setAdjustment = useSetAdjustmentMutation(client);

  const closeSheet = useCallback(() => {
    setSheetState(null);
    create.reset();
    changeDeadline.reset();
    setHours.reset();
    confirm.reset();
  }, [create.reset, changeDeadline.reset, setHours.reset, confirm.reset]);

  const leaveDay = useCallback(() => {
    setSheetState(null);
    setOpenDate(null);
  }, []);

  useEffect(() => {
    if (from === ORIGIN_APPROVALS) {
      setToast({
        kind: "success",
        message: SCHEDULE_ADMIN_COPY.arrivedFromApprovals,
      });
    }
  }, [from]);

  useEffect(() => {
    const asked = monthParam ?? dateParam?.slice(0, 7);

    if (asked !== undefined) {
      setMonth(asked);
    }
    setOpenDate(dateParam ?? null);
  }, [monthParam, dateParam]);

  useCloseSheetOnSuccess(create.isSuccess, create.reset, closeSheet);
  useCloseSheetOnSuccess(
    changeDeadline.isSuccess,
    changeDeadline.reset,
    closeSheet,
  );
  useCloseSheetOnSuccess(setHours.isSuccess, setHours.reset, closeSheet);
  useCloseSheetOnSuccess(close.isSuccess, close.reset, leaveDay);

  const dayList = days ?? [];
  const slotRows = openSlots ?? [];
  const applications = availabilities ?? [];

  const dayOf = new Map(dayList.map((day) => [day.work_date, day]));
  const vacancyOf = countOpenSlotsByDate(slotRows);

  const applicationCountOf = new Map<string, number>();
  const applicationNamesOf = new Map<string, string[]>();
  const applicationIdsOf = new Map<string, string[]>();

  for (const row of applications) {
    applicationCountOf.set(
      row.work_date,
      (applicationCountOf.get(row.work_date) ?? 0) + 1,
    );

    const names = applicationNamesOf.get(row.work_date) ?? [];

    names.push(row.profiles?.display_name ?? "");
    applicationNamesOf.set(row.work_date, names);

    const ids = applicationIdsOf.get(row.work_date) ?? [];

    ids.push(row.profile_id);
    applicationIdsOf.set(row.work_date, ids);
  }

  const confirmed = schedule?.confirmedAt != null;
  const deadline = schedule?.applicationDeadline ?? null;
  const monthName = formatMonthName(month);
  const fullyPast = isMonthFullyPast({ month, now });

  const affordance = confirmAffordance({
    applicationDeadline: deadline,
    confirmedAt: schedule?.confirmedAt ?? null,
    now,
  });

  const notifiedCount = new Set(
    dayList.flatMap((day) =>
      day.assignments
        .filter((assignment) => assignment.ended_at === null)
        .map((assignment) => assignment.profile_id),
    ),
  ).size;

  const goMonth = (step: number) => {
    setMonth(shiftMonth(month, step));
    setOpenDate(null);
    setPicking(false);
    setPicked([]);
  };

  const togglePicked = (date: string) =>
    setPicked(
      picked.includes(date)
        ? picked.filter((one) => one !== date)
        : [...picked, date],
    );

  const openPickedDays = async () => {
    const failed: string[] = [];

    for (const date of [...picked].sort()) {
      try {
        await open.mutateAsync({ workDate: date });
      } catch {
        failed.push(date);
      }
    }

    const message = openDaysFailureToast(failed);

    setPicked(failed);
    setToast(message === null ? null : { kind: "info", message });

    if (message === null) {
      setPicking(false);
    }
  };

  /**
   * 「자격도 주기」는 한 트랜잭션이 아니라 두 호출이다. 앞이 성공하고 뒤가 실패하면 자격만
   * 남는데, 자격은 사람의 속성이라 그 상태가 틀린 것이 아니다(plan AC-05).
   */
  const grantAndAssign = async (
    input: AddAssignmentInput,
    position: string,
  ) => {
    await grantPosition.mutateAsync({
      profileId: input.profileId,
      position,
    });
    addAssignment.mutate(input);
  };

  const day = openDate === null ? null : (dayOf.get(openDate) ?? null);
  const assignmentCount = day === null ? 0 : liveAssignmentCount(day);

  const listState: ScheduleAdminListState = loadingWindow
    ? "loading"
    : schedule == null
      ? "missing"
      : "calendar";

  const noticeLine =
    listState !== "calendar" || picking
      ? null
      : confirmed
        ? confirmedLine({
            confirmedAt: schedule.confirmedAt ?? now,
            notifiedCount,
          })
        : deadline === null
          ? null
          : deadlineLine({ applicationDeadline: deadline, now });

  const sheet = ((): ScheduleAdminSheet | null => {
    if (sheetState?.kind === "create") {
      return {
        kind: "create",
        deadline: sheetState.deadline,
        canSave: sheetState.deadline >= today,
        saving: create.isPending,
        failed: create.isError,
      };
    }

    if (sheetState?.kind === "deadline") {
      return {
        kind: "deadline",
        deadline: deadline ?? today,
        saving: changeDeadline.isPending,
        failed: changeDeadline.isError,
      };
    }

    if (sheetState?.kind === "confirm") {
      return {
        kind: "confirm",
        openSlots: slotRows,
        notifiedCount,
        confirming: confirm.isPending,
        done: confirm.isSuccess,
        failed: confirm.isError,
      };
    }

    if (day === null) {
      return null;
    }

    if (sheetState?.kind === "hours") {
      return {
        kind: "hours",
        starts: sheetState.starts,
        ends: sheetState.ends,
        canSave: isDayHoursSaveEnabled({
          starts: sheetState.starts,
          ends: sheetState.ends,
        }),
        saving: setHours.isPending,
        failed: setHours.isError,
      };
    }

    if (sheetState?.kind === "close") {
      return {
        kind: "close",
        workDate: day.work_date,
        assignmentCount,
        closing: close.isPending,
      };
    }

    return null;
  })();

  return {
    month,
    monthTitle: formatMonthTitle(month),
    today,
    listState,
    confirmed,
    canPickDays: schedule != null,
    emptyTitle: `${monthName}${fullyPast ? SCHEDULE_ADMIN_COPY.monthMissing : SCHEDULE_ADMIN_COPY.monthNotYet}`,
    canCreate: !fullyPast,
    createHint: `${SCHEDULE_ADMIN_COPY.createHintPrefix}${monthName}${SCHEDULE_ADMIN_COPY.createHintSuffix}`,
    createLabel: `${monthName}${SCHEDULE_ADMIN_COPY.createSuffix}`,
    noticeLine,
    showAllClosedHint:
      listState === "calendar" && dayList.length === 0 && !picking,
    showApplications: listState === "calendar" && !confirmed && !picking,
    applicationsTitle: `${SCHEDULE_ADMIN_COPY.applicationsPrefix}${applications.length}${SCHEDULE_ADMIN_COPY.applicationsSuffix}`,
    calendar: {
      isToday: (date) => date === today,
      stateOf: (date) =>
        adminCalendarDayState({
          isOpen: dayOf.has(date),
          isPicked: picking && picked.includes(date),
        }),
      canPress: (date) =>
        picking
          ? isSelectableForOpening({
              workDate: date,
              isOpen: dayOf.has(date),
              now,
            })
          : dayOf.has(date),
      press: (date) => (picking ? togglePicked(date) : setOpenDate(date)),
      applicationCountOf: (date) =>
        confirmed ? 0 : (applicationCountOf.get(date) ?? 0),
      vacancyCountOf: (date) =>
        confirmedVacancyCount({
          isConfirmed: confirmed,
          openSlotCount: vacancyOf[date] ?? 0,
        }),
    },
    picking,
    pickedCount: picked.length,
    opening: open.isPending,
    canOpenDays: picked.length > 0,
    openDaysLabel: openDaysButtonLabel(picked.length),
    startPicking: () => setPicking(true),
    stopPicking: () => {
      setPicking(false);
      setPicked([]);
    },
    openPickedDays,
    goPrevMonth: () => goMonth(-1),
    goNextMonth: () => goMonth(1),
    showConfirmCta:
      !picking && listState === "calendar" && affordance !== "ended",
    confirmLocked: affordance === "locked",
    confirmUnlockLine:
      affordance === "locked" && deadline !== null
        ? confirmUnlockLine(deadline)
        : null,
    confirmLabel:
      affordance === "locked"
        ? SCHEDULE_ADMIN_COPY.confirmLocked
        : `${monthName}${SCHEDULE_ADMIN_COPY.confirmSuffix}`,
    openCreateSheet: () => setSheetState({ kind: "create", deadline: "" }),
    openDeadlineSheet: () => setSheetState({ kind: "deadline" }),
    openConfirmSheet: () => setSheetState({ kind: "confirm" }),
    sheet,
    closeSheet,
    writeCreateDeadline: (typed) =>
      setSheetState((open) =>
        open?.kind === "create" ? { ...open, deadline: typed } : open,
      ),
    createSchedule: () => {
      if (sheetState?.kind === "create") {
        create.mutate({ month, deadline: sheetState.deadline });
      }
    },
    saveDeadline: (chosen) =>
      changeDeadline.mutate({ month, deadline: chosen }),
    confirmMonth: () => confirm.mutate({ month }),
    writeHoursStarts: (typed) =>
      setSheetState((open) =>
        open?.kind === "hours" ? { ...open, starts: typed } : open,
      ),
    writeHoursEnds: (typed) =>
      setSheetState((open) =>
        open?.kind === "hours" ? { ...open, ends: typed } : open,
      ),
    saveHours: () => {
      if (day !== null && sheetState?.kind === "hours") {
        setHours.mutate({
          workDate: day.work_date,
          starts: sheetState.starts,
          ends: sheetState.ends,
        });
      }
    },
    closeDay: () => {
      if (day !== null) {
        close.mutate({ workDate: day.work_date });
      }
    },
    toast,
    dismissToast: () => setToast(null),
    day:
      day === null
        ? null
        : {
            dayId: day.id,
            workDate: day.work_date,
            startsAt: day.starts_at,
            endsAt: day.ends_at,
            slots: day.slots,
            assignments: day.assignments,
            applicationNames: applicationNamesOf.get(day.work_date) ?? [],
            appliedProfileIds: applicationIdsOf.get(day.work_date) ?? [],
            members: activeMembers ?? [],
            qualifications: qualifications ?? [],
            slotRequests: (slotRequests ?? []).filter(
              (request) => request.slots.days.work_date === day.work_date,
            ),
            holidays: (payroll?.holidays ?? []).filter(
              (row) => row.holiday_date === day.work_date,
            ),
            adjustments: (payroll?.adjustments ?? []).filter(
              (row) => row.day_id === day.id,
            ),
            rehearsals: (rehearsals ?? []).filter(
              (row: RehearsalWithName) => row.work_date === day.work_date,
            ),
            serverNowMs: nowMs,
            gate: dayConfirmGate({
              openedAt: day.opened_at,
              confirmedAt: schedule?.confirmedAt ?? null,
            }),
            isConfirmed: confirmed,
            saving:
              addAssignment.isPending ||
              removeAssignment.isPending ||
              forceChange.isPending ||
              removeSlot.isPending ||
              sendWorkRequest.isPending,
            adjusting: setAdjustment.isPending,
            adjusted: setAdjustment.isSuccess,
            adjustError: setAdjustment.error,
            onPressHours: () =>
              setSheetState({
                kind: "hours",
                starts: clockLabel(day.starts_at),
                ends: clockLabel(day.ends_at),
              }),
            onCloseDay: () =>
              assignmentCount === 0
                ? close.mutate({ workDate: day.work_date })
                : setSheetState({ kind: "close" }),
            onAddSlot: (id, position) =>
              addSlot.mutate({ dayId: id, position }),
            onRemoveSlot: (slotId) => removeSlot.mutate({ slotId }),
            onMergeSlots: (id, fromPosition, toPosition) =>
              mergeSlots.mutate({
                dayId: id,
                from: fromPosition,
                to: toPosition,
              }),
            onSplitSlot: (slotId) => splitSlot.mutate({ slotId }),
            onAddAssignment: (input) => addAssignment.mutate(input),
            onGrantAndAssign: (input, position) =>
              void grantAndAssign(input, position),
            onRemoveAssignment: (assignmentId) =>
              removeAssignment.mutate({ assignmentId }),
            onForceChange: (assignmentId, profileId) =>
              forceChange.mutate({ assignmentId, profileId }),
            onSendWorkRequest: (slotId, profileIds) =>
              sendWorkRequest.mutate({ slotId, profileIds }),
            onSetHoliday: (on) =>
              setHoliday.mutate({ date: day.work_date, on }),
            onSetAdjustment: ({ profileId, minutes, reason }) =>
              setAdjustment.mutate({
                dayId: day.id,
                profileId,
                minutes,
                reason,
              }),
            onAdjustSettled: setAdjustment.reset,
            onReloadDay: reloadDays,
          },
    leaveDay,
  };
}
