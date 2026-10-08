export type ExcuseRow = {
  id: string;
  day_id: string;
  profile_id: string;
  body: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
  decision_reason: string | null;
};
