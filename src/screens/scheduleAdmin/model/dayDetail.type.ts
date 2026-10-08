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
import type {
  HolidayRow,
  HolidaySwitchState,
} from "@/screens/scheduleAdmin/model/holidaySwitch.policy";
import type { PickerRow } from "@/screens/scheduleAdmin/model/personPickerRows.policy";
import type {
  AdjustSheetAdjustment,
  AdjustSheetRehearsal,
  AdjustSheetRow,
} from "@/screens/scheduleAdmin/utils/adjustSheetRows.utils";
import type { ForceChangeCopyInput } from "@/screens/scheduleAdmin/utils/forceChangeCopy.utils";
import type { PositionSlot } from "@/screens/scheduleAdmin/utils/positionRows.utils";

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

export type PickerEntry = PickerRow & {
  photoUrl: string | null;
  gender: string | null;
};

export type PickerTarget = {
  position: string;
  slotId: string | null;
  replacing: {
    assignmentId: string;
    outgoingProfileId: string;
    outgoingName: string;
  } | null;
};

export type PendingChange =
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
