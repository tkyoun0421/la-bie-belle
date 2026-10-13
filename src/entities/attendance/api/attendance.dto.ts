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

export const CHECK_IN_COLUMNS = [
  "id",
  "day_id",
  "profile_id",
  "checked_at",
  "reported_at",
  "received_at",
  "method",
].join(", ");

export const EXCUSE_STATUS_COLUMNS = [
  "day_id",
  "profile_id",
  "submitted_at",
  "decided_at",
  "decision",
].join(", ");
