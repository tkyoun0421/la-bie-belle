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
