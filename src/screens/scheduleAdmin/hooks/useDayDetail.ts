import { useCallback, useEffect, useMemo, useState } from "react";
import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";
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
  DayDetailController,
  DayDetailInput,
  DayDetailPositionRow,
  PendingChange,
  PickerEntry,
  PickerTarget,
} from "@/screens/scheduleAdmin/model/dayDetail.type";
import { dayHoursLine } from "@/screens/scheduleAdmin/model/dayHoursForm.policy";
import {
  canDropOnTarget,
  dropOutcome,
} from "@/screens/scheduleAdmin/model/dragGesture.policy";
import { holidaySwitchState } from "@/screens/scheduleAdmin/model/holidaySwitch.policy";
import { canNotifyMember } from "@/screens/scheduleAdmin/model/notifyReach.policy";
import { pickOutcome } from "@/screens/scheduleAdmin/model/pickOutcome.policy";
import { pickerEntries } from "@/screens/scheduleAdmin/model/pickerEntries.policy";
import { slotRequestBadgeFor } from "@/screens/scheduleAdmin/model/slotRequestBadge.policy";
import {
  absenceMinutes,
  assignedMinutes,
} from "@/screens/scheduleAdmin/utils/absenceMinutes.utils";
import {
  adjustSheetHead,
  adjustSheetRows,
} from "@/screens/scheduleAdmin/utils/adjustSheetRows.utils";
import { adjustmentCountLine } from "@/screens/scheduleAdmin/utils/adjustmentCount.utils";
import { confirmChangeCopyOf } from "@/screens/scheduleAdmin/utils/confirmChangeCopy.utils";
import {
  dayApplicationsLine,
  dayDetailRows,
} from "@/screens/scheduleAdmin/utils/dayDetailRows.utils";
import { formatScheduleDate } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";
import {
  assignmentForSlot,
  groupSlotsByPosition,
  slotFillCount,
} from "@/screens/scheduleAdmin/utils/positionRows.utils";

const REVERT_MINUTES = 0;

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

  const [extra, setExtra] = useState<string | null>(null);

  const rows = dayDetailRows({ applicationCount: applicationNames.length });
  const groups = groupSlotsByPosition(slots);
  const fill = slotFillCount(slots, assignments);
  const canChangeStructure = allowsStructureChange(gate);

  const dayHours = useMemo(
    () => ({ startsAt, endsAt }),
    [startsAt, endsAt],
  );

  const adjustRows = useMemo(
    () =>
      adjustSheetRows({
        day: dayHours,
        assignments: assignments.map((one) => ({
          profileId: one.profileId,
          name: one.name ?? "",
          kind: one.kind,
          endedAt: one.endedAt,
        })),
        adjustments,
        rehearsals,
      }),
    [adjustments, assignments, dayHours, rehearsals],
  );

  const chosenRow = adjustRows.find((row) => row.profileId === chosen) ?? null;

  const chosenAdjustments: AdjustChoiceRow[] = adjustments.filter(
    (row) => row.profileId === chosen,
  );

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
      assignments.find((one) => one.profileId === profileId)?.name ??
      members.find((one) => one.id === profileId)?.display_name ??
      "",
    [assignments, members],
  );

  const canNotify = useCallback(
    (profileId: string) => canNotifyMember(members, profileId),
    [members],
  );

  const closeChoice = useCallback(() => {
    setChosen(null);
    setExtra(null);
    onAdjustSettled();
  }, [onAdjustSettled]);

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

  const requestBadgeOf = useCallback(
    (slotId: string) => slotRequestBadgeFor(slotId, slotRequests),
    [slotRequests],
  );

  const toggleRequested = useCallback((profileId: string) => {
    setPicked((taken) =>
      taken.includes(profileId)
        ? taken.filter((one) => one !== profileId)
        : [...taken, profileId],
    );
  }, []);

  const entries = useMemo(
    (): PickerEntry[] =>
      picker === null
        ? []
        : pickerEntries({
            target: picker,
            members,
            appliedProfileIds,
            qualifications,
            dayAssignments: assignments,
            slotRequests,
            serverNowMs,
          }),
    [
      appliedProfileIds,
      assignments,
      members,
      picker,
      qualifications,
      serverNowMs,
      slotRequests,
    ],
  );

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

      const outcome = pickOutcome(picker, entry);

      if (outcome.kind === "toggle_request") {
        toggleRequested(outcome.profileId);
        return;
      }

      if (outcome.kind === "merge_instead") {
        setToast(SCHEDULE_ADMIN_COPY.mergeInstead);
        return;
      }

      if (outcome.kind === "needs_qualification") {
        setQualifying(entry);
        return;
      }

      if (outcome.kind === "change") {
        commit(outcome.change);
      }
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
    (dragId: string, dropId: string) =>
      canDropOnTarget({
        dragId,
        dropId,
        slots,
        assignments,
        unlockedPositions: unlocked,
      }),
    [assignments, slots, unlocked],
  );

  const drop = useCallback(
    (dragId: string, dropId: string) => {
      const outcome = dropOutcome({ dragId, dropId, assignments });

      if (outcome.kind === "merge") {
        onMergeSlots(dayId, outcome.fromPosition, outcome.toPosition);
        return;
      }

      if (outcome.kind === "confirm") {
        setDiscarding({
          slotId: outcome.slotId,
          name: nameOf(outcome.profileId),
        });
        return;
      }

      if (outcome.kind === "remove") {
        onRemoveSlot(outcome.slotId);
      }
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
                  outgoingProfileId: openAssignment.profileId,
                  outgoingName: nameOf(openAssignment.profileId),
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
                outgoingProfileId: openAssignment.profileId,
                outgoingName: nameOf(openAssignment.profileId),
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
            copy: confirmChangeCopyOf(pending, canNotify),
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
