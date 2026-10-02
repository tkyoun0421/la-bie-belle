import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PERMISSION_OF_OTHERS,
  REACHABLE,
} from "@/entities/notification/consts/notification.const";
import { getReachState } from "@/entities/notification/model/reachState.policy";
import type { ScheduleAssignment } from "@/entities/schedule/api/schedule.dto";
import type { SlotRequest } from "@/entities/workRequest/api/workRequest.dto";
import type { AddAssignmentInput } from "@/features/scheduleAssign/api/addAssignment.api";
import {
  ADJUSTMENT_REASON,
  SCHEDULE_ADMIN_COPY,
} from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import {
  extraMinutes,
  nextMinuteDigits,
  showRevertOption,
  type AdjustChoiceRow,
} from "@/screens/scheduleAdmin/model/adjustChoiceState.policy";
import { adjustmentFailureAction } from "@/screens/scheduleAdmin/model/adjustmentFailure.policy";
import { allowsStructureChange } from "@/screens/scheduleAdmin/model/confirmGate.policy";
import type {
  DayDetailInput,
  PickerEntry,
} from "@/screens/scheduleAdmin/model/dayDetail.type";
import { dayHoursLine } from "@/screens/scheduleAdmin/model/dayHoursForm.policy";
import { discardSlotJudgement } from "@/screens/scheduleAdmin/model/discardSlot.policy";
import {
  holidaySwitchState,
  type HolidaySwitchState,
} from "@/screens/scheduleAdmin/model/holidaySwitch.policy";
import { mergeTargetValidity } from "@/screens/scheduleAdmin/model/mergeTarget.policy";
import { classifyPickerRows } from "@/screens/scheduleAdmin/model/personPickerRows.policy";
import { slotRequestBadge } from "@/screens/scheduleAdmin/model/slotRequestBadge.policy";
import {
  absenceMinutes,
  assignedMinutes,
} from "@/screens/scheduleAdmin/utils/absenceMinutes.utils";
import {
  adjustSheetHead,
  adjustSheetRows,
  type AdjustSheetRow,
} from "@/screens/scheduleAdmin/utils/adjustSheetRows.utils";
import { adjustmentCountLine } from "@/screens/scheduleAdmin/utils/adjustmentCount.utils";
import {
  dayApplicationsLine,
  dayDetailRows,
} from "@/screens/scheduleAdmin/utils/dayDetailRows.utils";
import {
  DISCARD_DROP_ID,
  positionOf,
  slotOf,
} from "@/screens/scheduleAdmin/utils/dragId.utils";
import type { ForceChangeCopyInput } from "@/screens/scheduleAdmin/utils/forceChangeCopy.utils";
import { formatScheduleDate } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";
import {
  POSITION_ORDER,
  assignmentForSlot,
  groupSlotsByPosition,
  slotFillCount,
  type PositionSlot,
} from "@/screens/scheduleAdmin/utils/positionRows.utils";

/**
 * 열린 날 하나의 상세를 쥐는 controller다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「날 상세 짜임」이다.
 *
 * **확정 갈림이 둘이다.** 알림이 나가는지는 그 달이 확정됐는지로 갈리고(확인 시트), 자물쇠와
 * 끌기와 자리 추가가 서는지는 그 날이 확정 시점에 있던 날인지로 갈린다
 * (`confirmGate.policy.ts`). 확정 뒤에 새로 연 날은 앞은 참이고 뒤도 참이다.
 *
 * **확정 뒤에는 모든 변경이 한 문을 지난다.** 배정·교육·교체·빼기 넷이 같은 `commit`으로
 * 모이는 것은 「물어보고 보낼지」가 넷에 같은 조건이어서고, 그래서 확인 시트가 하나다.
 *
 * **판정은 전부 `model/`에 있다.** 누가 어느 갈래로 서고 무엇이 합쳐지고 어느 실패가 목록을
 * 다시 읽게 하는지는 순수 함수가 알고, 이 자리가 하는 일은 그 답대로 상태를 옮기는 것까지다.
 *
 * **쓰는 손은 위에서 내려온다.** 조각은 제 질의를 안 들어(`dayDetail.type.ts`) 보내는 것은
 * 받은 콜백이고, 보내는 중인지와 실패도 받은 값이다.
 */

export type DayDetailPositionRow = {
  position: string;
  slots: readonly PositionSlot[];
  assignments: readonly ScheduleAssignment[];
  unlocked: boolean;
  canChangeStructure: boolean;
  nameOf: (profileId: string) => string;
  requestBadgeOf: (slotId: string) => string | null;
  onToggleLock: () => void;
  onPressEducation: () => void;
  onPressSlot: (slotId: string) => void;
  onAddSlot: () => void;
};

export type DayDetailPicker = {
  title: string;
  entries: readonly PickerEntry[];
  expanded: boolean;
  picked: readonly string[];
  sending: boolean;
  expand: () => void;
  pick: (entry: PickerEntry) => void;
  inspect: (entry: PickerEntry) => void;
  toggle: (profileId: string) => void;
  send: () => void;
  close: () => void;
};

export type DayDetailPerson = {
  name: string;
  photoUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  qualifications: readonly string[];
  close: () => void;
};

export type DayDetailQualification = {
  name: string;
  position: string;
  once: () => void;
  grant: () => void;
  close: () => void;
};

export type DayDetailSlotSheet = {
  confirmed: boolean;
  merged: boolean;
  replace: () => void;
  split: () => void;
  remove: () => void;
  close: () => void;
};

export type DayDetailAdjust = {
  head: string;
  rows: readonly AdjustSheetRow[];
  pickPerson: (profileId: string) => void;
  close: () => void;
};

export type DayDetailChoice = {
  name: string;
  assignedMinutes: number;
  canRevert: boolean;
  /** 연장을 골라 분 칸이 열렸는지다. 결근과 원래대로는 값을 안 묻는다. */
  extending: boolean;
  digits: string;
  canSend: boolean;
  sending: boolean;
  failureMessage: string | null;
  absent: () => void;
  revert: () => void;
  startExtending: () => void;
  writeDigits: (text: string) => void;
  extend: () => void;
  close: () => void;
};

export type DayDetailConfirmChange = {
  copy: ForceChangeCopyInput;
  saving: boolean;
  confirm: () => void;
  close: () => void;
};

export type DayDetailDiscard = {
  name: string;
  removing: boolean;
  confirm: () => void;
  close: () => void;
};

export type DayDetailController = {
  title: string;
  fillLabel: string;
  showHours: boolean;
  hoursLine: string;
  holiday: HolidaySwitchState;
  adjustmentLine: string;
  showApplications: boolean;
  applicationsLine: string;
  positions: readonly DayDetailPositionRow[];
  showCloseDay: boolean;
  canDrop: (dragId: string, dropId: string) => boolean;
  drop: (dragId: string, dropId: string) => void;
  openAdjust: () => void;
  picker: DayDetailPicker | null;
  person: DayDetailPerson | null;
  qualification: DayDetailQualification | null;
  slotSheet: DayDetailSlotSheet | null;
  adjust: DayDetailAdjust | null;
  choice: DayDetailChoice | null;
  confirmChange: DayDetailConfirmChange | null;
  discard: DayDetailDiscard | null;
  toast: string | null;
  dismissToast: () => void;
};

/** 「원래대로」는 행을 지우는 것이 아니라 0분인 새 행을 넣는 것이다. */
const REVERT_MINUTES = 0;

/** 확정 뒤에 확인 시트를 거쳐 나가는 변경들이다. 확정 전에는 같은 값이 바로 실행된다. */
type PendingChange =
  | {
      kind: "add";
      slotId: string;
      profileId: string;
      name: string;
      skipQualification: boolean;
      grant: { position: string } | null;
    }
  | { kind: "training"; position: string; profileId: string; name: string }
  | {
      kind: "swap";
      assignmentId: string;
      profileId: string;
      outgoingProfileId: string;
      outgoingName: string;
      incomingName: string;
    }
  | {
      kind: "remove";
      assignmentId: string;
      outgoingProfileId: string;
      outgoingName: string;
    };

type PickerTarget = {
  position: string;
  slotId: string | null;
  replacing: {
    assignmentId: string;
    outgoingProfileId: string;
    outgoingName: string;
  } | null;
};

/**
 * 알림이 그 사람에게 닿는지는 의사와 기기 둘로 갈린다(`reachState.policy.ts`) — 목록이 그
 * 둘을 같이 실어 와서 여기서 한 번 더 읽을 것이 없다. 못 받는 사람의 문안은
 * `forceChangeCopy.utils.ts`가 들고, 이 자리는 갈래를 합쳐 「닿나」 하나로만 넘긴다 — 그
 * 자리에서 관리자가 할 일이 어느 갈래든 따로 연락 하나라서다.
 */
function confirmCopyOf(
  change: PendingChange,
  canNotify: (profileId: string) => boolean,
): ForceChangeCopyInput {
  if (change.kind === "swap") {
    return {
      kind: "swap",
      outgoingName: change.outgoingName,
      outgoingCanNotify: canNotify(change.outgoingProfileId),
      incomingName: change.incomingName,
      incomingCanNotify: canNotify(change.profileId),
    };
  }

  if (change.kind === "remove") {
    return {
      kind: "remove",
      outgoingName: change.outgoingName,
      outgoingCanNotify: canNotify(change.outgoingProfileId),
    };
  }

  return {
    kind: change.kind,
    incomingName: change.name,
    incomingCanNotify: canNotify(change.profileId),
  };
}

export function useDayDetail(input: DayDetailInput): DayDetailController {
  const {
    dayId,
    workDate,
    startsAt,
    endsAt,
    slots,
    assignments,
    applicationNames,
    appliedProfileIds,
    members,
    qualifications,
    slotRequests,
    holidays,
    adjustments,
    rehearsals,
    serverNowMs,
    gate,
    isConfirmed,
    saving,
    adjusting,
    adjusted,
    adjustError,
    onAddSlot,
    onRemoveSlot,
    onMergeSlots,
    onSplitSlot,
    onAddAssignment,
    onGrantAndAssign,
    onRemoveAssignment,
    onForceChange,
    onSendWorkRequest,
    onSetAdjustment,
    onAdjustSettled,
    onReloadDay,
  } = input;

  const [unlocked, setUnlocked] = useState<readonly string[]>([]);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [inspecting, setInspecting] = useState<PickerEntry | null>(null);
  const [qualifying, setQualifying] = useState<PickerEntry | null>(null);
  const [openSlotSheet, setOpenSlotSheet] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [discarding, setDiscarding] = useState<{
    slotId: string;
    name: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  /**
   * 연장으로 적고 있는 분이다. `null`이면 아직 연장을 안 골랐다는 뜻이라 「열렸나」와 「무엇을
   * 적었나」가 한 값으로 접힌다 — 닫힌 칸에 값이 남아 있는 상태가 아예 안 선다.
   */
  const [extra, setExtra] = useState<string | null>(null);

  const rows = dayDetailRows({ applicationCount: applicationNames.length });
  const groups = groupSlotsByPosition(slots);
  const fill = slotFillCount(slots, assignments);
  const canChangeStructure = allowsStructureChange(gate);

  const dayHours = useMemo(
    () => ({ starts_at: startsAt, ends_at: endsAt }),
    [startsAt, endsAt],
  );

  const adjustRows = useMemo(
    () =>
      adjustSheetRows({
        day: dayHours,
        assignments: assignments.map((one) => ({
          profile_id: one.profile_id,
          name: one.profiles?.display_name ?? "",
          kind: one.kind,
          ended_at: one.ended_at,
        })),
        adjustments,
        rehearsals,
      }),
    [adjustments, assignments, dayHours, rehearsals],
  );

  const chosenRow = adjustRows.find((row) => row.profile_id === chosen) ?? null;

  const chosenAdjustments: AdjustChoiceRow[] = adjustments.filter(
    (row) => row.profile_id === chosen,
  );

  /**
   * `not_allowed`는 그날 배정이 사라진 것이라 고르기 시트를 닫고 목록을 다시 읽는다. 나머지
   * 실패는 시트를 열어둔 채 문구만 띄운다 — 넣던 분이 남아야 다시 보낼 수 있다.
   */
  const failure =
    adjustError === null ? null : adjustmentFailureAction(adjustError);

  const staleDay = failure !== null && failure.refetch;

  useEffect(() => {
    if (!adjusted && !staleDay) {
      return;
    }

    setChosen(null);
    setExtra(null);

    if (staleDay) {
      onReloadDay();
    }

    onAdjustSettled();
  }, [adjusted, staleDay, onAdjustSettled, onReloadDay]);

  const nameOf = useCallback(
    (profileId: string) =>
      assignments.find((one) => one.profile_id === profileId)?.profiles
        ?.display_name ??
      members.find((one) => one.id === profileId)?.display_name ??
      "",
    [assignments, members],
  );

  /** 목록에 없는 사람은 못 받는 쪽으로 읽는다 — 안 가는 것을 간다고 말하지 않는다. */
  const canNotify = useCallback(
    (profileId: string) => {
      const found = members.find((one) => one.id === profileId);

      return (
        found !== undefined &&
        getReachState({
          notificationsEnabled: found.notifications_enabled,
          hasDevice: found.has_device,
          permission: PERMISSION_OF_OTHERS,
        }) === REACHABLE
      );
    },
    [members],
  );

  const closeChoice = useCallback(() => {
    setChosen(null);
    setExtra(null);
    onAdjustSettled();
  }, [onAdjustSettled]);

  /** 사람을 바꾸면 적던 분이 남지 않는다 — 남의 줄에 넣을 값이 아니다. */
  const choosePerson = useCallback((profileId: string) => {
    setChosen(profileId);
    setExtra(null);
  }, []);

  const sendAdjustment = useCallback(
    (minutes: number, reason: string) => {
      if (chosen !== null) {
        onSetAdjustment({ profileId: chosen, minutes, reason });
      }
    },
    [chosen, onSetAdjustment],
  );

  const closePicker = useCallback(() => {
    setPicker(null);
    setExpanded(false);
    setPicked([]);
    setInspecting(null);
    setQualifying(null);
  }, []);

  const requestOf = useMemo(() => {
    const bySlot = new Map<string, SlotRequest>();

    for (const request of slotRequests) {
      if (request.slot_id !== null) {
        bySlot.set(request.slot_id, request);
      }
    }

    return bySlot;
  }, [slotRequests]);

  const requestBadgeOf = useCallback(
    (slotId: string) => {
      const request = requestOf.get(slotId);

      return slotRequestBadge(
        request === undefined
          ? null
          : {
              closed_at: request.closed_at,
              candidates: request.request_candidates,
            },
      );
    },
    [requestOf],
  );

  const toggleRequested = useCallback((profileId: string) => {
    setPicked((taken) =>
      taken.includes(profileId)
        ? taken.filter((one) => one !== profileId)
        : [...taken, profileId],
    );
  }, []);

  /**
   * 요청은 빈 자리에만 보낸다 — 교육 픽커에는 자리가 없고 강제 변경 픽커의 자리는 이미
   * 차 있다. 그 둘에서는 체크박스를 떼어 보낼 길 자체를 없앤다.
   */
  const entries = useMemo((): PickerEntry[] => {
    if (picker === null) {
      return [];
    }

    const requestable = picker.slotId !== null && picker.replacing === null;
    const request =
      picker.slotId === null ? undefined : requestOf.get(picker.slotId);

    const classified = classifyPickerRows({
      position: picker.position,
      members: members.map((one) => ({
        profileId: one.id,
        displayName: one.display_name ?? "",
      })),
      appliedProfileIds,
      qualifiedProfileIds: qualifications
        .filter((one) => one.position === picker.position)
        .map((one) => one.profile_id),
      dayAssignments: assignments,
      requestCandidates: request?.request_candidates ?? [],
      serverNowMs,
    });

    return classified.map((row) => {
      const found = members.find((one) => one.id === row.profileId);

      return {
        ...row,
        checkbox: row.checkbox && requestable,
        photoUrl: found?.photo_url ?? null,
        gender: found?.gender ?? null,
      };
    });
  }, [
    appliedProfileIds,
    assignments,
    members,
    picker,
    qualifications,
    requestOf,
    serverNowMs,
  ]);

  const run = useCallback(
    (change: PendingChange) => {
      if (change.kind === "add") {
        const assignment: AddAssignmentInput = {
          profileId: change.profileId,
          kind: "regular",
          slotId: change.slotId,
          skipQualification: change.skipQualification,
        };

        if (change.grant === null) {
          onAddAssignment(assignment);
        } else {
          onGrantAndAssign(assignment, change.grant.position);
        }
      }

      if (change.kind === "training") {
        onAddAssignment({
          profileId: change.profileId,
          kind: "training",
          dayId,
          position: change.position,
        });
      }

      if (change.kind === "swap") {
        onForceChange(change.assignmentId, change.profileId);
      }

      if (change.kind === "remove") {
        onRemoveAssignment(change.assignmentId);
      }
    },
    [
      dayId,
      onAddAssignment,
      onForceChange,
      onGrantAndAssign,
      onRemoveAssignment,
    ],
  );

  /** 확정 뒤에는 모든 변경에 확인 시트가 선다 — 그 사람의 근무가 생기고 없어지는 사건이다. */
  const commit = useCallback(
    (change: PendingChange) => {
      closePicker();
      setOpenSlotSheet(null);

      if (isConfirmed) {
        setPending(change);
        return;
      }

      run(change);
    },
    [closePicker, isConfirmed, run],
  );

  const pick = useCallback(
    (entry: PickerEntry) => {
      if (picker === null) {
        return;
      }

      if (entry.checkbox) {
        toggleRequested(entry.profileId);
        return;
      }

      if (entry.category === "not_applied") {
        return;
      }

      if (entry.category === "assigned") {
        setToast(SCHEDULE_ADMIN_COPY.mergeInstead);
        return;
      }

      if (entry.category === "not_qualified") {
        setQualifying(entry);
        return;
      }

      if (picker.replacing !== null) {
        commit({
          kind: "swap",
          assignmentId: picker.replacing.assignmentId,
          profileId: entry.profileId,
          outgoingProfileId: picker.replacing.outgoingProfileId,
          outgoingName: picker.replacing.outgoingName,
          incomingName: entry.displayName,
        });
        return;
      }

      commit(
        picker.slotId === null
          ? {
              kind: "training",
              position: picker.position,
              profileId: entry.profileId,
              name: entry.displayName,
            }
          : {
              kind: "add",
              slotId: picker.slotId,
              profileId: entry.profileId,
              name: entry.displayName,
              skipQualification: false,
              grant: null,
            },
      );
    },
    [commit, picker, toggleRequested],
  );

  const resolveQualification = useCallback(
    (grant: boolean) => {
      if (picker === null || qualifying === null || picker.slotId === null) {
        return;
      }

      commit({
        kind: "add",
        slotId: picker.slotId,
        profileId: qualifying.profileId,
        name: qualifying.displayName,
        skipQualification: true,
        grant: grant ? { position: picker.position } : null,
      });
    },
    [commit, picker, qualifying],
  );

  /**
   * 요청을 보내는 손은 배정과 같다 — 시트를 먼저 닫고 보낸다. 요청은 고른 전원에게 한 번에
   * 나가고 결과는 자리 카드의 배지로 돌아온다.
   */
  const sendRequest = useCallback(() => {
    const slotId = picker?.slotId ?? null;

    if (slotId === null || picked.length === 0) {
      return;
    }

    const taken = picked;

    closePicker();
    onSendWorkRequest(slotId, taken);
  }, [closePicker, onSendWorkRequest, picked, picker]);

  const pressSlot = useCallback(
    (position: string, slotId: string) => {
      if (assignmentForSlot(slotId, assignments) === null) {
        setPicker({ position, slotId, replacing: null });
        setExpanded(false);
        return;
      }

      setOpenSlotSheet(slotId);
    },
    [assignments],
  );

  const canDrop = useCallback(
    (dragId: string, dropId: string) => {
      if (slotOf(dragId) !== null) {
        return dropId === DISCARD_DROP_ID;
      }

      const from = positionOf(dragId);
      const to = positionOf(dropId);

      if (from === null || to === null) {
        return false;
      }

      return (
        mergeTargetValidity({
          slots,
          assignments,
          fromPosition: from,
          toPosition: to,
          fromUnlocked: unlocked.includes(from),
          toUnlocked: unlocked.includes(to),
        }) === "valid"
      );
    },
    [assignments, slots, unlocked],
  );

  const drop = useCallback(
    (dragId: string, dropId: string) => {
      const fromPosition = positionOf(dragId);
      const toPosition = positionOf(dropId);

      if (fromPosition !== null && toPosition !== null) {
        onMergeSlots(dayId, fromPosition, toPosition);
        return;
      }

      const slotId = slotOf(dragId);

      if (slotId === null) {
        return;
      }

      const taken = assignmentForSlot(slotId, assignments);

      if (
        taken !== null &&
        discardSlotJudgement([taken]) === "needs_confirmation"
      ) {
        setDiscarding({ slotId, name: nameOf(taken.profile_id) });
        return;
      }

      onRemoveSlot(slotId);
    },
    [assignments, dayId, nameOf, onMergeSlots, onRemoveSlot],
  );

  const openSlot = slots.find((slot) => slot.id === openSlotSheet) ?? null;
  const openAssignment =
    openSlot === null ? null : assignmentForSlot(openSlot.id, assignments);

  const positions = POSITION_ORDER.map((position): DayDetailPositionRow => ({
    position,
    slots: groups[position],
    assignments,
    unlocked: unlocked.includes(position),
    canChangeStructure,
    nameOf,
    requestBadgeOf,
    onToggleLock: () =>
      setUnlocked(
        unlocked.includes(position)
          ? unlocked.filter((one) => one !== position)
          : [...unlocked, position],
      ),
    onPressEducation: () => {
      setPicker({ position, slotId: null, replacing: null });
      setExpanded(false);
    },
    onPressSlot: (slotId) => pressSlot(position, slotId),
    onAddSlot: () => onAddSlot(dayId, position),
  }));

  return {
    title: formatScheduleDate(workDate),
    fillLabel: `${fill.filled}/${fill.total}`,
    showHours: rows.includes("hours"),
    hoursLine: dayHoursLine(startsAt, endsAt),
    holiday: holidaySwitchState(holidays),
    adjustmentLine: adjustmentCountLine(adjustments),
    showApplications: rows.includes("applications"),
    applicationsLine: dayApplicationsLine(applicationNames),
    positions,
    showCloseDay: !isConfirmed,
    canDrop,
    drop,
    openAdjust: () => setAdjustOpen(true),
    picker:
      picker === null
        ? null
        : {
            title: `${picker.position} · ${formatScheduleDate(workDate)}`,
            entries,
            expanded:
              expanded ||
              entries.every((entry) => entry.category !== "assignable"),
            picked,
            sending: saving,
            expand: () => setExpanded(true),
            pick,
            inspect: setInspecting,
            toggle: toggleRequested,
            send: sendRequest,
            close: closePicker,
          },
    person:
      inspecting === null
        ? null
        : {
            name: inspecting.displayName,
            photoUrl: inspecting.photoUrl,
            gender: inspecting.gender,
            birthDate:
              members.find((one) => one.id === inspecting.profileId)
                ?.birth_date ?? null,
            qualifications: qualifications
              .filter((one) => one.profile_id === inspecting.profileId)
              .map((one) => one.position),
            close: () => setInspecting(null),
          },
    qualification:
      qualifying === null || picker === null
        ? null
        : {
            name: qualifying.displayName,
            position: picker.position,
            once: () => resolveQualification(false),
            grant: () => resolveQualification(true),
            close: () => setQualifying(null),
          },
    slotSheet:
      openSlot === null || openAssignment === null
        ? null
        : {
            confirmed: isConfirmed,
            merged: openSlot.positions.length > 1,
            replace: () => {
              setPicker({
                position: openSlot.positions[0],
                slotId: openSlot.id,
                replacing: {
                  assignmentId: openAssignment.id,
                  outgoingProfileId: openAssignment.profile_id,
                  outgoingName: nameOf(openAssignment.profile_id),
                },
              });
              setExpanded(false);
              setOpenSlotSheet(null);
            },
            split: () => {
              setOpenSlotSheet(null);
              onSplitSlot(openSlot.id);
            },
            remove: () =>
              commit({
                kind: "remove",
                assignmentId: openAssignment.id,
                outgoingProfileId: openAssignment.profile_id,
                outgoingName: nameOf(openAssignment.profile_id),
              }),
            close: () => setOpenSlotSheet(null),
          },
    adjust: adjustOpen
      ? {
          head: adjustSheetHead(dayHours),
          rows: adjustRows,
          pickPerson: choosePerson,
          close: () => {
            setAdjustOpen(false);
            setChosen(null);
            setExtra(null);
          },
        }
      : null,
    choice:
      chosenRow === null
        ? null
        : {
            name: chosenRow.name,
            assignedMinutes: assignedMinutes(dayHours),
            canRevert: showRevertOption(chosenAdjustments),
            extending: extra !== null,
            digits: extra ?? "",
            canSend: extraMinutes(extra ?? "") !== null,
            sending: adjusting,
            failureMessage: failure === null ? null : failure.message,
            absent: () =>
              sendAdjustment(
                absenceMinutes(dayHours),
                ADJUSTMENT_REASON.absence,
              ),
            revert: () =>
              sendAdjustment(REVERT_MINUTES, ADJUSTMENT_REASON.revert),
            startExtending: () => setExtra(""),
            writeDigits: (text) => setExtra(nextMinuteDigits(text)),
            extend: () => {
              const minutes = extraMinutes(extra ?? "");

              if (minutes !== null) {
                sendAdjustment(minutes, ADJUSTMENT_REASON.extra);
              }
            },
            close: closeChoice,
          },
    confirmChange:
      pending === null
        ? null
        : {
            copy: confirmCopyOf(pending, canNotify),
            saving,
            confirm: () => {
              run(pending);
              setPending(null);
            },
            close: () => setPending(null),
          },
    discard:
      discarding === null
        ? null
        : {
            name: discarding.name,
            removing: saving,
            confirm: () => {
              onRemoveSlot(discarding.slotId);
              setDiscarding(null);
            },
            close: () => setDiscarding(null),
          },
    toast,
    dismissToast: () => setToast(null),
  };
}
