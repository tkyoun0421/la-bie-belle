export type AvailabilityRow = {
  profile_id: string;
  work_date: string;
  profiles: { display_name: string | null } | null;
};
