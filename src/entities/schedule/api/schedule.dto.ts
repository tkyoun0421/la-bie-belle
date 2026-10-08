export type ScheduleCheckIn = {
  id: string;
  profile_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
};

export type ScheduleAssignment = {
  id: string;
  slot_id: string | null;
  position: string;
  kind: string;
  profile_id: string;
  ended_at: string | null;
  profiles: { display_name: string | null } | null;
};

export type ScheduleSlot = {
  id: string;
  positions: string[];
  ended_at: string | null;
};

export type ScheduleDay = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
  opened_at: string;
  slots: ScheduleSlot[];
  assignments: ScheduleAssignment[];
  check_ins: ScheduleCheckIn[];
};

export type OpenSlot = {
  slot_id: string;
  day_id: string;
  work_date: string;
  positions: string[];
};

export type MonthWindowRow = {
  application_deadline: string | null;
  confirmed_at: string | null;
};
