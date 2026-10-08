export type ScheduleCheckInRow = {
  id: string;
  profile_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
};

export type ScheduleAssignmentRow = {
  id: string;
  slot_id: string | null;
  position: string;
  kind: string;
  profile_id: string;
  ended_at: string | null;
  profiles: { display_name: string | null } | null;
};

export type ScheduleSlotRow = {
  id: string;
  positions: string[];
  ended_at: string | null;
};

export type ScheduleDayRow = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
  opened_at: string;
  slots: ScheduleSlotRow[];
  assignments: ScheduleAssignmentRow[];
  check_ins: ScheduleCheckInRow[];
};

export type OpenSlotRow = {
  slot_id: string | null;
  day_id: string | null;
  work_date: string | null;
  positions: string[] | null;
};

export type MonthWindowRow = {
  application_deadline: string | null;
  confirmed_at: string | null;
};
