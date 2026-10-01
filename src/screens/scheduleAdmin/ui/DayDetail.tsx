import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { DragProvider } from "@/shared/ui/DragAndDrop";
import { DropZone } from "@/shared/ui/DropZone";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Switch } from "@/shared/ui/Switch";
import { Text } from "@/shared/ui/Text";
import type { Qualification } from "@/entities/member/api/getQualifications.api";
import {
  PERMISSION_OF_OTHERS,
  REACHABLE,
  getReachState,
} from "@/entities/notification/model/reachState.policy";
import type {
  ScheduleAssignment,
  ScheduleSlot,
} from "@/entities/schedule/api/getMonthSchedule.api";
import type { SlotRequest } from "@/entities/workRequest/api/getSlotRequests.api";
import type { AddAssignmentInput } from "@/features/scheduleAssign/api/addAssignment.api";
import {
  showRevertOption,
  type AdjustChoiceRow,
} from "@/screens/scheduleAdmin/model/adjustChoiceState.policy";
import { adjustmentFailureAction } from "@/screens/scheduleAdmin/model/adjustmentFailure.policy";
import {
  allowsStructureChange,
  type DayConfirmGate,
} from "@/screens/scheduleAdmin/model/confirmGate.policy";
import { dayHoursLine } from "@/screens/scheduleAdmin/model/dayHoursForm.policy";
import { discardSlotJudgement } from "@/screens/scheduleAdmin/model/discardSlot.policy";
import {
  holidaySwitchState,
  type HolidayRow,
} from "@/screens/scheduleAdmin/model/holidaySwitch.policy";
import { mergeTargetValidity } from "@/screens/scheduleAdmin/model/mergeTarget.policy";
import { classifyPickerRows } from "@/screens/scheduleAdmin/model/personPickerRows.policy";
import { slotRequestBadge } from "@/screens/scheduleAdmin/model/slotRequestBadge.policy";
import { AdjustChoiceSheet } from "@/screens/scheduleAdmin/ui/AdjustChoiceSheet";
import { AdjustSheet } from "@/screens/scheduleAdmin/ui/AdjustSheet";
import { ConfirmChangeSheet } from "@/screens/scheduleAdmin/ui/ConfirmChangeSheet";
import { DiscardSlotSheet } from "@/screens/scheduleAdmin/ui/DiscardSlotSheet";
import {
  PersonPickerSheet,
  type PickerEntry,
} from "@/screens/scheduleAdmin/ui/PersonPickerSheet";
import { PersonSheet } from "@/screens/scheduleAdmin/ui/PersonSheet";
import {
  PositionRow,
  ROW_DRAG_PREFIX,
  SLOT_DRAG_PREFIX,
} from "@/screens/scheduleAdmin/ui/PositionRow";
import { QualificationSheet } from "@/screens/scheduleAdmin/ui/QualificationSheet";
import { SlotSheet } from "@/screens/scheduleAdmin/ui/SlotSheet";
import {
  absenceMinutes,
  assignedMinutes,
} from "@/screens/scheduleAdmin/utils/absenceMinutes.utils";
import {
  adjustSheetHead,
  adjustSheetRows,
  type AdjustSheetAdjustment,
  type AdjustSheetRehearsal,
} from "@/screens/scheduleAdmin/utils/adjustSheetRows.utils";
import { adjustmentCountLine } from "@/screens/scheduleAdmin/utils/adjustmentCount.utils";
import {
  dayApplicationsLine,
  dayDetailRows,
} from "@/screens/scheduleAdmin/utils/dayDetailRows.utils";
import type { ForceChangeCopyInput } from "@/screens/scheduleAdmin/utils/forceChangeCopy.utils";
import { formatScheduleDate } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";
import {
  POSITION_ORDER,
  assignmentForSlot,
  groupSlotsByPosition,
  slotFillCount,
} from "@/screens/scheduleAdmin/utils/positionRows.utils";

/**
 * 열린 날 하나의 상세다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「날 상세 짜임」이다.
 *
 * **확정 갈림이 둘이다.** 알림이 나가는지는 그 달이 확정됐는지로 갈리고(확인 시트), 자물쇠와
 * 끌기와 자리 추가가 서는지는 그 날이 확정 시점에 있던 날인지로 갈린다(`confirmGate.ts`).
 * 확정 뒤에 새로 연 날은 앞은 참이고 뒤도 참이다.
 *
 * **판정은 전부 `model/`에 있다.** 이 파일이 하는 일은 어느 시트를 세울지 고르고 받은
 * 판정대로 콜백을 부르는 것까지다 — 누가 어느 줄에 앉고 무엇이 합쳐지는지는 순수 함수가 안다.
 *
 * **임시공휴일 줄과 근무 조정 줄은 확정 잠금 밖이다.** `canChangeStructure`는 포지션과 자리의
 * 것이고, 조정도 임시공휴일도 근무표 확정을 안 기다린다(PAY-020·PAY-027).
 */

const DROP_ZONE_ID = "discard";

export const SCHEDULE_HOLIDAY_SWITCH_TEST_ID = "schedule-holiday-switch";

const HOLIDAY_LABEL = "임시공휴일";

const ADJUST_LABEL = "근무 조정";

const ABSENCE_REASON = "결근";

const EXTRA_REASON = "연장";

const REVERT_REASON = "원래대로";

const REVERT_MINUTES = 0;

const EDUCATION_KIND = "training";

const REGULAR_KIND = "regular";

export type DayDetailMember = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  gender: string | null;
  birth_date: string | null;
  notifications_enabled: boolean;
  has_device: boolean;
};

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

export type DayDetailProps = {
  dayId: string;
  workDate: string;
  startsAt: string;
  endsAt: string;
  slots: readonly ScheduleSlot[];
  assignments: readonly ScheduleAssignment[];
  applicationNames: readonly string[];
  appliedProfileIds: readonly string[];
  members: readonly DayDetailMember[];
  qualifications: readonly Qualification[];
  slotRequests: readonly SlotRequest[];
  holidays: readonly HolidayRow[];
  adjustments: readonly AdjustSheetAdjustment[];
  rehearsals: readonly AdjustSheetRehearsal[];
  serverNowMs: number;
  gate: DayConfirmGate;
  isConfirmed: boolean;
  saving: boolean;
  adjusting: boolean;
  adjusted: boolean;
  adjustError: Error | null;
  onBack: () => void;
  onPressHours: () => void;
  onCloseDay: () => void;
  onAddSlot: (dayId: string, position: string) => void;
  onRemoveSlot: (slotId: string) => void;
  onMergeSlots: (dayId: string, from: string, to: string) => void;
  onSplitSlot: (slotId: string) => void;
  onAddAssignment: (input: AddAssignmentInput) => void;
  onGrantAndAssign: (input: AddAssignmentInput, position: string) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  onForceChange: (assignmentId: string, profileId: string) => void;
  onSendWorkRequest: (slotId: string, profileIds: readonly string[]) => void;
  onSetHoliday: (on: boolean) => void;
  onSetAdjustment: (input: {
    profileId: string;
    minutes: number;
    reason: string;
  }) => void;
  onAdjustSettled: () => void;
  onReloadDay: () => void;
};

export function DayDetail({
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
  onBack,
  onPressHours,
  onCloseDay,
  onAddSlot,
  onRemoveSlot,
  onMergeSlots,
  onSplitSlot,
  onAddAssignment,
  onGrantAndAssign,
  onRemoveAssignment,
  onForceChange,
  onSendWorkRequest,
  onSetHoliday,
  onSetAdjustment,
  onAdjustSettled,
  onReloadDay,
}: DayDetailProps) {
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

  const rows = dayDetailRows({ applicationCount: applicationNames.length });
  const groups = groupSlotsByPosition(slots);
  const fill = slotFillCount(slots, assignments);
  const canChangeStructure = allowsStructureChange(gate);

  const dayHours = useMemo(
    () => ({ starts_at: startsAt, ends_at: endsAt }),
    [startsAt, endsAt],
  );

  const holiday = holidaySwitchState(holidays);

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
      const member = members.find((one) => one.id === profileId);

      return (
        member !== undefined &&
        getReachState({
          notificationsEnabled: member.notifications_enabled,
          hasDevice: member.has_device,
          permission: PERMISSION_OF_OTHERS,
        }) === REACHABLE
      );
    },
    [members],
  );

  const hideToast = useCallback(() => setToast(null), []);

  const closeChoice = useCallback(() => {
    setChosen(null);
    onAdjustSettled();
  }, [onAdjustSettled]);

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
    setPicked((chosen) =>
      chosen.includes(profileId)
        ? chosen.filter((one) => one !== profileId)
        : [...chosen, profileId],
    );
  }, []);

  /**
   * 배정과 같은 손이다 — 시트를 먼저 닫고 보낸다. 요청은 고른 전원에게 한 번에 나가고
   * 결과는 자리 카드의 배지로 돌아온다.
   */
  const sendRequest = useCallback(() => {
    const slotId = picker?.slotId ?? null;

    if (slotId === null || picked.length === 0) {
      return;
    }

    const chosen = picked;

    closePicker();
    onSendWorkRequest(slotId, chosen);
  }, [closePicker, onSendWorkRequest, picked, picker]);

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
      members: members.map((member) => ({
        profileId: member.id,
        displayName: member.display_name ?? "",
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
      const member = members.find((one) => one.id === row.profileId);

      return {
        ...row,
        checkbox: row.checkbox && requestable,
        photoUrl: member?.photo_url ?? null,
        gender: member?.gender ?? null,
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
        const input = {
          profileId: change.profileId,
          kind: REGULAR_KIND,
          slotId: change.slotId,
          skipQualification: change.skipQualification,
        };

        if (change.grant === null) {
          onAddAssignment(input);
        } else {
          onGrantAndAssign(input, change.grant.position);
        }
      }

      if (change.kind === "training") {
        onAddAssignment({
          profileId: change.profileId,
          kind: EDUCATION_KIND,
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
        setToast("겸임은 자리를 합쳐 만드세요");
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
      if (dragId.startsWith(SLOT_DRAG_PREFIX)) {
        return dropId === DROP_ZONE_ID;
      }

      if (
        !dragId.startsWith(ROW_DRAG_PREFIX) ||
        !dropId.startsWith(ROW_DRAG_PREFIX)
      ) {
        return false;
      }

      const from = dragId.slice(ROW_DRAG_PREFIX.length);
      const to = dropId.slice(ROW_DRAG_PREFIX.length);

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
      if (dragId.startsWith(ROW_DRAG_PREFIX)) {
        onMergeSlots(
          dayId,
          dragId.slice(ROW_DRAG_PREFIX.length),
          dropId.slice(ROW_DRAG_PREFIX.length),
        );
        return;
      }

      const slotId = dragId.slice(SLOT_DRAG_PREFIX.length);
      const taken = assignmentForSlot(slotId, assignments);

      if (
        discardSlotJudgement(taken === null ? [] : [taken]) ===
        "needs_confirmation"
      ) {
        setDiscarding({ slotId, name: nameOf(taken!.profile_id) });
        return;
      }

      onRemoveSlot(slotId);
    },
    [assignments, dayId, nameOf, onMergeSlots, onRemoveSlot],
  );

  const openSlot = slots.find((slot) => slot.id === openSlotSheet) ?? null;
  const openAssignment =
    openSlot === null ? null : assignmentForSlot(openSlot.id, assignments);

  return (
    <>
      <AppBar
        title={formatScheduleDate(workDate)}
        onBack={onBack}
        right={
          <Text size="sm" tone="muted" numeric>
            {`${fill.filled}/${fill.total}`}
          </Text>
        }
      />

      <DragProvider canDrop={canDrop} onDrop={drop}>
        <ScrollView>
          <View className="gap-3 px-5 pb-8">
            <Card className="py-0">
              {rows.includes("hours") ? (
                <ListRow
                  title={dayHoursLine(startsAt, endsAt)}
                  onPress={onPressHours}
                />
              ) : null}

              <View className="flex-row items-center gap-3 py-3">
                <View className="flex-1">
                  <Text size="base" weight="medium">
                    {HOLIDAY_LABEL}
                  </Text>
                  <Text size="xs" tone="subtle" className="mt-0.5">
                    {holiday.helperLine}
                  </Text>
                </View>
                <Switch
                  testID={SCHEDULE_HOLIDAY_SWITCH_TEST_ID}
                  value={holiday.checked}
                  disabled={holiday.locked}
                  onValueChange={onSetHoliday}
                />
              </View>

              <ListRow
                title={ADJUST_LABEL}
                right={
                  <Text size="xs" tone="subtle" numeric>
                    {adjustmentCountLine(adjustments)}
                  </Text>
                }
                chevron
                className="py-3"
                onPress={() => setAdjustOpen(true)}
              />

              {rows.includes("applications") ? (
                <ListRow
                  title={dayApplicationsLine(applicationNames)}
                  chevron={false}
                />
              ) : null}
            </Card>

            <View>
              {POSITION_ORDER.map((position) => (
                <PositionRow
                  key={position}
                  position={position}
                  slots={groups[position]}
                  assignments={assignments}
                  unlocked={unlocked.includes(position)}
                  canChangeStructure={canChangeStructure}
                  nameOf={nameOf}
                  requestBadgeOf={requestBadgeOf}
                  onToggleLock={() =>
                    setUnlocked(
                      unlocked.includes(position)
                        ? unlocked.filter((one) => one !== position)
                        : [...unlocked, position],
                    )
                  }
                  onPressEducation={() => {
                    setPicker({ position, slotId: null, replacing: null });
                    setExpanded(false);
                  }}
                  onPressSlot={(slotId) => pressSlot(position, slotId)}
                  onAddSlot={() => onAddSlot(dayId, position)}
                />
              ))}
            </View>

            {isConfirmed ? null : (
              <Button variant="secondary" onPress={onCloseDay}>
                이 날 닫기
              </Button>
            )}
          </View>
        </ScrollView>

        <DropZone
          id={DROP_ZONE_ID}
          label="여기에 놓으면 자리를 지워요"
          activeLabel="놓으면 지워져요"
        />
      </DragProvider>

      {picker === null ? null : (
        <SheetLayer onDismiss={closePicker}>
          <PersonPickerSheet
            title={`${picker.position} · ${formatScheduleDate(workDate)}`}
            entries={entries}
            expanded={
              expanded ||
              entries.every((entry) => entry.category !== "assignable")
            }
            picked={picked}
            sending={saving}
            onExpand={() => setExpanded(true)}
            onPick={pick}
            onInspect={setInspecting}
            onToggle={toggleRequested}
            onSend={sendRequest}
          />
        </SheetLayer>
      )}

      {inspecting === null ? null : (
        <SheetLayer onDismiss={() => setInspecting(null)}>
          <PersonSheet
            name={inspecting.displayName}
            photoUrl={inspecting.photoUrl}
            gender={inspecting.gender}
            birthDate={
              members.find((one) => one.id === inspecting.profileId)
                ?.birth_date ?? null
            }
            qualifications={qualifications
              .filter((one) => one.profile_id === inspecting.profileId)
              .map((one) => one.position)}
          />
        </SheetLayer>
      )}

      {qualifying === null || picker === null ? null : (
        <SheetLayer onDismiss={() => setQualifying(null)}>
          <QualificationSheet
            name={qualifying.displayName}
            position={picker.position}
            onOnce={() => resolveQualification(false)}
            onGrant={() => resolveQualification(true)}
            onClose={() => setQualifying(null)}
          />
        </SheetLayer>
      )}

      {openSlot === null || openAssignment === null ? null : (
        <SheetLayer onDismiss={() => setOpenSlotSheet(null)}>
          <SlotSheet
            confirmed={isConfirmed}
            merged={openSlot.positions.length > 1}
            onReplace={() => {
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
            }}
            onSplit={() => {
              setOpenSlotSheet(null);
              onSplitSlot(openSlot.id);
            }}
            onRemove={() =>
              commit({
                kind: "remove",
                assignmentId: openAssignment.id,
                outgoingProfileId: openAssignment.profile_id,
                outgoingName: nameOf(openAssignment.profile_id),
              })
            }
            onClose={() => setOpenSlotSheet(null)}
          />
        </SheetLayer>
      )}

      {adjustOpen ? (
        <SheetLayer
          onDismiss={() => {
            setAdjustOpen(false);
            setChosen(null);
          }}
        >
          <AdjustSheet
            head={adjustSheetHead(dayHours)}
            rows={adjustRows}
            onPickPerson={setChosen}
          />
        </SheetLayer>
      ) : null}

      {chosenRow === null ? null : (
        <SheetLayer onDismiss={closeChoice}>
          <AdjustChoiceSheet
            name={chosenRow.name}
            assignedMinutes={assignedMinutes(dayHours)}
            canRevert={showRevertOption(chosenAdjustments)}
            sending={adjusting}
            failureMessage={failure === null ? null : failure.message}
            onAbsent={() =>
              sendAdjustment(absenceMinutes(dayHours), ABSENCE_REASON)
            }
            onRevert={() => sendAdjustment(REVERT_MINUTES, REVERT_REASON)}
            onExtend={(minutes) => sendAdjustment(minutes, EXTRA_REASON)}
            onClose={closeChoice}
          />
        </SheetLayer>
      )}

      {pending === null ? null : (
        <SheetLayer onDismiss={() => setPending(null)}>
          <ConfirmChangeSheet
            copy={confirmCopyOf(pending, canNotify)}
            saving={saving}
            onClose={() => setPending(null)}
            onConfirm={() => {
              run(pending);
              setPending(null);
            }}
          />
        </SheetLayer>
      )}

      {discarding === null ? null : (
        <SheetLayer onDismiss={() => setDiscarding(null)}>
          <DiscardSlotSheet
            name={discarding.name}
            removing={saving}
            onCancel={() => setDiscarding(null)}
            onConfirm={() => {
              onRemoveSlot(discarding.slotId);
              setDiscarding(null);
            }}
          />
        </SheetLayer>
      )}

      {toast === null ? null : (
        <FloatingToast kind="info" message={toast} onDone={hideToast} />
      )}
    </>
  );
}

/**
 * 알림이 그 사람에게 닿는지는 의사와 기기 둘로 갈린다(`reachState.ts`) — 목록이 그 둘을
 * 같이 실어 와서 여기서 한 번 더 읽을 것이 없다. 못 받는 사람의 문안은 `forceChangeCopy.ts`
 * 가 들고 있고, 이 자리는 갈래를 합쳐 「닿나」 하나로만 넘긴다 — 그 자리에서 관리자가 할 일이
 * 어느 갈래든 따로 연락 하나라서다.
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
