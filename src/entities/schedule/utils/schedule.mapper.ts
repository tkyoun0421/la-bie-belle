import type {
  MonthWindowRow,
  OpenSlotRow,
  ScheduleAssignmentRow,
  ScheduleCheckInRow,
  ScheduleDayRow,
  ScheduleSlotRow,
} from "@/entities/schedule/api/schedule.dto";
import type {
  MonthWindow,
  OpenSlot,
  ScheduleAssignment,
  ScheduleCheckIn,
  ScheduleDay,
  ScheduleSlot,
} from "@/entities/schedule/model/schedule.type";

function toSlot(row: ScheduleSlotRow): ScheduleSlot {
  return {
    id: row.id,
    positions: row.positions,
    endedAt: row.ended_at,
  };
}

function toAssignment(row: ScheduleAssignmentRow): ScheduleAssignment {
  return {
    id: row.id,
    slotId: row.slot_id,
    position: row.position,
    kind: row.kind,
    profileId: row.profile_id,
    endedAt: row.ended_at,
    name: row.profiles?.display_name ?? null,
  };
}

function toCheckIn(row: ScheduleCheckInRow): ScheduleCheckIn {
  return {
    id: row.id,
    profileId: row.profile_id,
    checkedAt: row.checked_at,
    reportedAt: row.reported_at,
    receivedAt: row.received_at,
  };
}

export function toScheduleDay(row: ScheduleDayRow): ScheduleDay {
  return {
    id: row.id,
    workDate: row.work_date,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    openedAt: row.opened_at,
    slots: row.slots.map(toSlot),
    assignments: row.assignments.map(toAssignment),
    checkIns: row.check_ins.map(toCheckIn),
  };
}

export function toOpenSlot(row: OpenSlotRow): OpenSlot | null {
  const { slot_id, day_id, work_date, positions } = row;

  if (
    slot_id === null ||
    day_id === null ||
    work_date === null ||
    positions === null
  ) {
    return null;
  }

  return { slotId: slot_id, dayId: day_id, workDate: work_date, positions };
}

export function toMonthWindow(row: MonthWindowRow): MonthWindow {
  return {
    applicationDeadline: row.application_deadline,
    confirmedAt: row.confirmed_at,
  };
}
