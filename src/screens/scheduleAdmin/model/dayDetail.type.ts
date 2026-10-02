import type {
  ActiveMemberRow,
  Qualification,
} from "@/entities/member/api/member.dto";
import type {
  ScheduleAssignment,
  ScheduleSlot,
} from "@/entities/schedule/api/schedule.dto";
import type { SlotRequest } from "@/entities/workRequest/api/workRequest.dto";
import type { AddAssignmentInput } from "@/features/scheduleAssign/api/addAssignment.api";
import type { DayConfirmGate } from "@/screens/scheduleAdmin/model/confirmGate.policy";
import type { HolidayRow } from "@/screens/scheduleAdmin/model/holidaySwitch.policy";
import type { PickerRow } from "@/screens/scheduleAdmin/model/personPickerRows.policy";
import type {
  AdjustSheetAdjustment,
  AdjustSheetRehearsal,
} from "@/screens/scheduleAdmin/utils/adjustSheetRows.utils";

/**
 * 날 상세가 위에서 받는 것 전부다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「날 상세 짜임」이다.
 *
 * **조각이 제 질의를 안 든다.** 달력과 날 상세가 한 라우트라 읽는 질의가 같고, 그 아홉을 한
 * 번만 거는 자리가 화면의 controller다 — 날 상세는 그것이 걸러 준 것과 쓰는 손을 받는다.
 *
 * **타입이 `model`에 사는 까닭.** 주는 쪽(`useScheduleAdminScreen`)과 받는 쪽
 * (`useDayDetail`·`DayDetail.tsx`) 셋이 같은 모양을 봐야 하는데, 어느 하나가 소유하면 나머지
 * 둘이 그 파일을 거슬러 당긴다.
 */
export type DayDetailInput = {
  dayId: string;
  workDate: string;
  startsAt: string;
  endsAt: string;
  slots: readonly ScheduleSlot[];
  assignments: readonly ScheduleAssignment[];
  applicationNames: readonly string[];
  appliedProfileIds: readonly string[];
  members: readonly ActiveMemberRow[];
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

/**
 * 사람 픽커 한 줄이다 — 판정이 낸 갈래에 얼굴과 성별이 얹힌다. 갈래는 `model`이 내고 사진은
 * 명단에서 오는데, 줄을 세우는 쪽이 controller라 모양도 여기 산다.
 */
export type PickerEntry = PickerRow & {
  photoUrl: string | null;
  gender: string | null;
};
