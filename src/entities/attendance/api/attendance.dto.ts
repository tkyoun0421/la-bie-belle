export type CheckInRow = {
  id: string;
  day_id: string;
  profile_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
  method: string;
};

export type ExcuseStatusRow = {
  day_id: string;
  profile_id: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
};
