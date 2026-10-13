export type RehearsalRow = {
  id: string;
  profile_id: string;
  work_date: string;
  starts_at: string | null;
  ends_at: string | null;
  count: number | null;
};

export type NamedRehearsalRow = RehearsalRow & {
  profiles: { display_name: string | null } | null;
};

export const REHEARSAL_COLUMNS =
  "id, profile_id, work_date, starts_at, ends_at, count";
