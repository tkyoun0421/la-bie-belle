export type Rehearsal = {
  id: string;
  profile_id: string;
  work_date: string;
  starts_at: string | null;
  ends_at: string | null;
  count: number | null;
};

export type RehearsalWithName = Rehearsal & {
  profiles: { display_name: string | null } | null;
};
