export type WorkAssignment = {
  id: string;
  day_id: string;
  profile_id: string;
  display_name: string;
  position: string;
  kind: string;
  ended_at: string | null;
};

export type WorkDay = {
  id: string;
  work_date: string;
  starts_at: string;
  ends_at: string;
};

export type WorkInputs = {
  assignments: WorkAssignment[];
  days: WorkDay[];
};

export type PersonTotal = {
  profileId: string;
  displayName: string;
  minutes: number;
  count: number;
};

export type PositionTotal = {
  position: string;
  minutes: number;
  count: number;
};

export type WorkTotals = {
  totalMinutes: number;
  totalCount: number;
  byPerson: PersonTotal[];
  byPosition: PositionTotal[];
};

export type MyWorkTotals = {
  totalMinutes: number;
  totalCount: number;
  byPosition: PositionTotal[];
};
