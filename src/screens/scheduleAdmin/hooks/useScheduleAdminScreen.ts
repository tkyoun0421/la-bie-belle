import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  ADMIN_APPLICATIONS_PATH,
  ADMIN_APPROVALS_PATH,
  NOTIFICATIONS_PATH,
  ORIGIN_APPROVALS,
  ORIGIN_NOTIFICATIONS,
} from "@/shared/consts/navigation.const";
import { useCloseSheetOnSuccess } from "@/shared/hooks/useCloseSheetOnSuccess";
import { useMonthCursor } from "@/shared/hooks/useMonthCursor";
import { useToast, type ToastState } from "@/shared/hooks/useToast";
import type { ScheduleDayCellState } from "@/shared/ui/ScheduleDayCell";
import { kstDateOf } from "@/shared/utils/kstDate";
import { useMonthAvailabilitiesQuery } from "@/entities/availability/services/useMonthAvailabilitiesQuery";
import { useServerNow } from "@/entities/clock/hooks/useServerNow";

import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { useQualificationsQuery } from "@/entities/member/services/useQualificationsQuery";
import { usePayrollMonthsQuery } from "@/entities/payroll/services/usePayrollMonthsQuery";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import { useAllRehearsalsQuery } from "@/entities/rehearsal/services/useAllRehearsalsQuery";
import { liveAssignmentCount } from "@/entities/schedule/api/getMonthSchedule.api";
import type { OpenSlot } from "@/entities/schedule/model/schedule.type";
import { useMonthScheduleQuery } from "@/entities/schedule/services/useMonthScheduleQuery";
import { useMonthWindowQuery } from "@/entities/schedule/services/useMonthWindowQuery";
import { useOpenSlotsQuery } from "@/entities/schedule/services/useOpenSlotsQuery";
import {
  confirmedLine,
  formatMonthName,
  formatMonthTitle,
} from "@/entities/schedule/utils/formatScheduleDate.utils";
import { countOpenSlotsByDate } from "@/entities/schedule/utils/groupOpenSlots.utils";
import { useSlotRequestsQuery } from "@/entities/workRequest/services/useSlotRequestsQuery";
import { useSetAdjustmentMutation } from "@/features/adjustment/services/useSetAdjustmentMutation";
import { DEADLINE_SHEET_COPY } from "@/features/availabilitySubmit/consts/availabilitySubmit.const";
import { useSetApplicationDeadlineMutation } from "@/features/availabilitySubmit/services/useSetApplicationDeadlineMutation";
import { useSetHolidayMutation } from "@/features/holiday/services/useSetHolidayMutation";
import { useGrantPositionMutation } from "@/features/qualificationGrant/services/useGrantPositionMutation";
import type { AddAssignmentInput } from "@/features/scheduleAssign/api/addAssignment.api";
import { useAddAssignmentMutation } from "@/features/scheduleAssign/services/useAddAssignmentMutation";
import { useRemoveAssignmentMutation } from "@/features/scheduleAssign/services/useRemoveAssignmentMutation";
import { useForceChangeMutation } from "@/features/scheduleConfirm/services/useForceChangeMutation";
import { useCloseDayMutation } from "@/features/scheduleDay/services/useCloseDayMutation";
import { useOpenDayMutation } from "@/features/scheduleDay/services/useOpenDayMutation";
import { useAddSlotMutation } from "@/features/scheduleSlot/services/useAddSlotMutation";
import { useMergeSlotsMutation } from "@/features/scheduleSlot/services/useMergeSlotsMutation";
import { useRemoveSlotMutation } from "@/features/scheduleSlot/services/useRemoveSlotMutation";
import { useSplitSlotMutation } from "@/features/scheduleSlot/services/useSplitSlotMutation";
import { useSendWorkRequestMutation } from "@/features/workRequest/services/useSendWorkRequestMutation";
import { SCHEDULE_ADMIN_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
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
import { isMonthFullyPast } from "@/screens/scheduleAdmin/model/monthEmptyState.policy";
import {
  isSelectableForOpening,
  openDaysButtonLabel,
  openDaysFailureToast,
} from "@/screens/scheduleAdmin/model/openModeSelection.policy";

import { deadlineLine } from "@/screens/scheduleAdmin/utils/deadlineLine.utils";

export type ScheduleAdminListState = "loading" | "missing" | "calendar";

export type ScheduleAdminCalendar = {
  isToday: (date: string) => boolean;
  stateOf: (date: string) => ScheduleDayCellState;
  canPress: (date: string) => boolean;
  press: (date: string) => void;
  applicationCountOf: (date: string) => number;
  vacancyCountOf: (date: string) => number | null;
};

export type ScheduleAdminSheet =
  | { kind: "create" }
  | {
      kind: "deadline";
      deadline: string;
      canSave: boolean;
      sending: boolean;
      failedLine: string | null;
    }
  | {
      kind: "confirm";
      openSlots: readonly OpenSlot[];
      notifiedCount: number;
    }
  | { kind: "hours"; workDate: string; startsAt: string; endsAt: string }
  | { kind: "close"; workDate: string; assignmentCount: number };

export type ScheduleAdminScreenParams = {
  month?: string;
  date?: string;
  from?: string;
};

export type ScheduleAdminScreenController = {
  month: string;
  monthTitle: string;
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
  changeDeadlineDraft: (typed: string) => void;
  saveDeadline: () => void;
  toast: ToastState | null;
  dismissToast: () => void;
  day: DayDetailInput | null;
  leaveDay: () => void;
  goBack: () => void;
  backFromDay: () => void;
  openApplications: () => void;
};

type SheetState =
  | { kind: "create" }
  | { kind: "deadline"; draft: string | null }
  | { kind: "confirm" }
  | { kind: "hours" }
  | { kind: "close" };

export function useScheduleAdminScreen({
  month: monthParam,
  date: dateParam,
  from,
}: ScheduleAdminScreenParams): ScheduleAdminScreenController {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();

  const nowMs = useServerNow();
  const now = new Date(nowMs).toISOString();
  const today = kstDateOf(now);

  const [openDate, setOpenDate] = useState<string | null>(dateParam ?? null);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [sheetState, setSheetState] = useState<SheetState | null>(null);

  const leaveMonth = useCallback(() => {
    setOpenDate(null);
    setPicking(false);
    setPicked([]);
  }, []);

  const { month, goPrev, goNext, jumpTo } = useMonthCursor(
    monthParam ?? dateParam?.slice(0, 7) ?? today.slice(0, 7),
    leaveMonth,
  );

  const { data: schedule, isLoading: loadingWindow } = useMonthWindowQuery(
    supabase,
    month,
  );
  const { data: days, refetch: reloadDays } = useMonthScheduleQuery(
    supabase,
    month,
  );
  const { data: openSlots } = useOpenSlotsQuery(supabase, month);
  const { data: availabilities } = useMonthAvailabilitiesQuery(supabase, month);
  const { data: activeMembers } = useMembersQuery(supabase, "active");
  const { data: qualifications } = useQualificationsQuery(supabase);
  const { data: slotRequests } = useSlotRequestsQuery(supabase, month);
  const { data: payroll } = usePayrollMonthsQuery(supabase, [month]);
  const { data: rehearsals } = useAllRehearsalsQuery(supabase, month);

  const changeDeadline = useSetApplicationDeadlineMutation(supabase);
  const open = useOpenDayMutation(supabase);
  const close = useCloseDayMutation(supabase);
  const addSlot = useAddSlotMutation(supabase);
  const removeSlot = useRemoveSlotMutation(supabase);
  const mergeSlots = useMergeSlotsMutation(supabase);
  const splitSlot = useSplitSlotMutation(supabase);
  const addAssignment = useAddAssignmentMutation(supabase);
  const removeAssignment = useRemoveAssignmentMutation(supabase);
  const forceChange = useForceChangeMutation(supabase);
  const grantPosition = useGrantPositionMutation(supabase);
  const sendWorkRequest = useSendWorkRequestMutation(supabase);
  const setHoliday = useSetHolidayMutation(supabase);
  const setAdjustment = useSetAdjustmentMutation(supabase);

  const closeSheet = useCallback(() => {
    setSheetState(null);
    changeDeadline.reset();
  }, [changeDeadline.reset]);

  const leaveDay = useCallback(() => {
    setSheetState(null);
    setOpenDate(null);
  }, []);

  const backFromDay = useCallback(() => {
    if (from === ORIGIN_APPROVALS) {
      router.replace(ADMIN_APPROVALS_PATH);
      return;
    }

    if (from === ORIGIN_NOTIFICATIONS) {
      router.replace(NOTIFICATIONS_PATH);
      return;
    }

    leaveDay();
  }, [from, router, leaveDay]);

  useEffect(() => {
    if (from === ORIGIN_APPROVALS) {
      showToast("success", SCHEDULE_ADMIN_COPY.arrivedFromApprovals);
    }
  }, [from, showToast]);

  useEffect(() => {
    const asked = monthParam ?? dateParam?.slice(0, 7);

    if (asked !== undefined) {
      jumpTo(asked);
    }
    setOpenDate(dateParam ?? null);
  }, [monthParam, dateParam, jumpTo]);

  useCloseSheetOnSuccess(
    changeDeadline.isSuccess,
    changeDeadline.reset,
    closeSheet,
  );
  useCloseSheetOnSuccess(close.isSuccess, close.reset, leaveDay);

  const dayList = days ?? [];
  const slotRows = openSlots ?? [];
  const applications = availabilities ?? [];

  const dayOf = new Map(dayList.map((day) => [day.workDate, day]));
  const vacancyOf = countOpenSlotsByDate(slotRows);

  const applicationCountOf = new Map<string, number>();
  const applicationNamesOf = new Map<string, string[]>();
  const applicationIdsOf = new Map<string, string[]>();

  for (const row of applications) {
    applicationCountOf.set(
      row.workDate,
      (applicationCountOf.get(row.workDate) ?? 0) + 1,
    );

    const names = applicationNamesOf.get(row.workDate) ?? [];

    names.push(row.name ?? "");
    applicationNamesOf.set(row.workDate, names);

    const ids = applicationIdsOf.get(row.workDate) ?? [];

    ids.push(row.profileId);
    applicationIdsOf.set(row.workDate, ids);
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
        .filter((assignment) => assignment.endedAt === null)
        .map((assignment) => assignment.profileId),
    ),
  ).size;

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

    if (message === null) {
      dismissToast();
      setPicking(false);

      return;
    }

    showToast("info", message);
  };

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
    if (day !== null) {
      if (sheetState?.kind === "hours") {
        return {
          kind: "hours",
          workDate: day.workDate,
          startsAt: day.startsAt,
          endsAt: day.endsAt,
        };
      }

      if (sheetState?.kind === "close") {
        return { kind: "close", workDate: day.workDate, assignmentCount };
      }

      return null;
    }

    if (sheetState?.kind === "create") {
      return { kind: "create" };
    }

    if (sheetState?.kind === "deadline") {
      const typed = sheetState.draft ?? deadline ?? today;

      return {
        kind: "deadline",
        deadline: typed,
        canSave: typed >= today,
        sending: changeDeadline.isPending,
        failedLine: changeDeadline.isError
          ? DEADLINE_SHEET_COPY.saveFailed
          : null,
      };
    }

    if (sheetState?.kind === "confirm") {
      return { kind: "confirm", openSlots: slotRows, notifiedCount };
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
    goPrevMonth: goPrev,
    goNextMonth: goNext,
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
    openCreateSheet: () => setSheetState({ kind: "create" }),
    openDeadlineSheet: () => setSheetState({ kind: "deadline", draft: null }),
    openConfirmSheet: () => setSheetState({ kind: "confirm" }),
    sheet,
    closeSheet,
    changeDeadlineDraft: (typed) =>
      setSheetState((open) =>
        open?.kind === "deadline" ? { ...open, draft: typed } : open,
      ),
    saveDeadline: () => {
      if (sheetState?.kind === "deadline") {
        changeDeadline.mutate({
          month,
          deadline: sheetState.draft ?? deadline ?? today,
        });
      }
    },
    toast,
    dismissToast,
    day:
      day === null
        ? null
        : {
            dayId: day.id,
            workDate: day.workDate,
            startsAt: day.startsAt,
            endsAt: day.endsAt,
            slots: day.slots,
            assignments: day.assignments,
            applicationNames: applicationNamesOf.get(day.workDate) ?? [],
            appliedProfileIds: applicationIdsOf.get(day.workDate) ?? [],
            members: activeMembers ?? [],
            qualifications: qualifications ?? [],
            slotRequests: (slotRequests ?? []).filter(
              (request) => request.workDate === day.workDate,
            ),
            holidays: (payroll?.holidays ?? []).filter(
              (row) => row.holidayDate === day.workDate,
            ),
            adjustments: (payroll?.adjustments ?? []).filter(
              (row) => row.dayId === day.id,
            ),
            rehearsals: (rehearsals ?? []).filter(
              (row: Rehearsal) => row.workDate === day.workDate,
            ),
            serverNowMs: nowMs,
            gate: dayConfirmGate({
              openedAt: day.openedAt,
              confirmedAt: schedule?.confirmedAt ?? null,
            }),
            isConfirmed: confirmed,
            sending:
              addAssignment.isPending ||
              removeAssignment.isPending ||
              forceChange.isPending ||
              removeSlot.isPending ||
              sendWorkRequest.isPending,
            adjusting: setAdjustment.isPending,
            adjusted: setAdjustment.isSuccess,
            adjustError: setAdjustment.error,
            onPressHours: () => setSheetState({ kind: "hours" }),
            onCloseDay: () =>
              assignmentCount === 0
                ? close.mutate({ workDate: day.workDate })
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
            onSetHoliday: (on) => setHoliday.mutate({ date: day.workDate, on }),
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
    goBack: () => router.back(),
    backFromDay,
    openApplications: () =>
      router.push(`${ADMIN_APPLICATIONS_PATH}?month=${month}`),
  };
}
