import { useCallback, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { DragProvider } from "@/shared/ui/DragAndDrop";
import { DropZone } from "@/shared/ui/DropZone";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Text } from "@/shared/ui/Text";
import type { AddAssignmentInput } from "@/entities/schedule/dals/add-assignment";
import type {
  ScheduleAssignment,
  ScheduleSlot,
} from "@/entities/schedule/dals/get-month-schedule";
import type { Qualification } from "@/entities/schedule/dals/get-qualifications";
import type { SlotRequest } from "@/entities/schedule/dals/get-slot-requests";
import {
  allowsStructureChange,
  type DayConfirmGate,
} from "@/screens/schedule-admin/model/confirm-gate";
import {
  dayApplicationsLine,
  dayDetailRows,
} from "@/screens/schedule-admin/model/day-detail-rows";
import { dayHoursLine } from "@/screens/schedule-admin/model/day-hours-form";
import { discardSlotJudgement } from "@/screens/schedule-admin/model/discard-slot";
import type { ForceChangeCopyInput } from "@/screens/schedule-admin/model/force-change-copy";
import { formatScheduleDate } from "@/screens/schedule-admin/model/format-schedule-date";
import { mergeTargetValidity } from "@/screens/schedule-admin/model/merge-target";
import { classifyPickerRows } from "@/screens/schedule-admin/model/person-picker-rows";
import {
  POSITION_ORDER,
  assignmentForSlot,
  groupSlotsByPosition,
  slotFillCount,
} from "@/screens/schedule-admin/model/position-rows";
import { slotRequestBadge } from "@/screens/schedule-admin/model/slot-request-badge";
import { ConfirmChangeSheet } from "@/screens/schedule-admin/ui/ConfirmChangeSheet";
import { DiscardSlotSheet } from "@/screens/schedule-admin/ui/DiscardSlotSheet";
import {
  PersonPickerSheet,
  type PickerEntry,
} from "@/screens/schedule-admin/ui/PersonPickerSheet";
import { PersonSheet } from "@/screens/schedule-admin/ui/PersonSheet";
import {
  PositionRow,
  ROW_DRAG_PREFIX,
  SLOT_DRAG_PREFIX,
} from "@/screens/schedule-admin/ui/PositionRow";
import { QualificationSheet } from "@/screens/schedule-admin/ui/QualificationSheet";
import { SlotSheet } from "@/screens/schedule-admin/ui/SlotSheet";

/**
 * 열린 날 하나의 상세다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「날 상세 짜임」이다.
 *
 * **확정 갈림이 둘이다.** 알림이 나가는지는 그 달이 확정됐는지로 갈리고(확인 시트), 자물쇠와
 * 끌기와 자리 추가가 서는지는 그 날이 확정 시점에 있던 날인지로 갈린다(`confirm-gate.ts`).
 * 확정 뒤에 새로 연 날은 앞은 참이고 뒤도 참이다.
 *
 * **판정은 전부 `model/`에 있다.** 이 파일이 하는 일은 어느 시트를 세울지 고르고 받은
 * 판정대로 콜백을 부르는 것까지다 — 누가 어느 줄에 앉고 무엇이 합쳐지는지는 순수 함수가 안다.
 *
 * **임시공휴일 줄과 근무 조정 줄은 아직 없다.** `payroll-adjust`가 더한다(spec 「범위 밖」).
 */

const DROP_ZONE_ID = "discard";

const EDUCATION_KIND = "training";

const REGULAR_KIND = "regular";

export type DayDetailMember = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  gender: string | null;
  birth_date: string | null;
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
      outgoingName: string;
      incomingName: string;
    }
  | { kind: "remove"; assignmentId: string; outgoingName: string };

type PickerTarget = {
  position: string;
  slotId: string | null;
  replacing: { assignmentId: string; outgoingName: string } | null;
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
  serverNowMs: number;
  gate: DayConfirmGate;
  isConfirmed: boolean;
  saving: boolean;
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
  serverNowMs,
  gate,
  isConfirmed,
  saving,
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

  const rows = dayDetailRows({ applicationCount: applicationNames.length });
  const groups = groupSlotsByPosition(slots);
  const fill = slotFillCount(slots, assignments);
  const canChangeStructure = allowsStructureChange(gate);

  const nameOf = useCallback(
    (profileId: string) =>
      assignments.find((one) => one.profile_id === profileId)?.profiles
        ?.display_name ??
      members.find((one) => one.id === profileId)?.display_name ??
      "",
    [assignments, members],
  );

  const hideToast = useCallback(() => setToast(null), []);

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
              {rows.map((row) =>
                row === "hours" ? (
                  <ListRow
                    key={row}
                    title={dayHoursLine(startsAt, endsAt)}
                    onPress={onPressHours}
                  />
                ) : (
                  <ListRow
                    key={row}
                    title={dayApplicationsLine(applicationNames)}
                    chevron={false}
                  />
                ),
              )}
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
                outgoingName: nameOf(openAssignment.profile_id),
              })
            }
            onClose={() => setOpenSlotSheet(null)}
          />
        </SheetLayer>
      )}

      {pending === null ? null : (
        <SheetLayer onDismiss={() => setPending(null)}>
          <ConfirmChangeSheet
            copy={confirmCopyOf(pending)}
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
 * 알림을 받을 수 있는지는 푸시 토큰이 아는데 그 읽기는 `notification-emit`의 몫이다. 여기서는
 * 「간다」로 두고, 못 받는 사람의 문안은 `force-change-copy.ts`가 이미 들고 있다.
 */
function confirmCopyOf(change: PendingChange): ForceChangeCopyInput {
  if (change.kind === "swap") {
    return {
      kind: "swap",
      outgoingName: change.outgoingName,
      outgoingCanNotify: true,
      incomingName: change.incomingName,
      incomingCanNotify: true,
    };
  }

  if (change.kind === "remove") {
    return {
      kind: "remove",
      outgoingName: change.outgoingName,
      outgoingCanNotify: true,
    };
  }

  return {
    kind: change.kind,
    incomingName: change.name,
    incomingCanNotify: true,
  };
}
