export type RehearsalKind = "count" | "time";

export type RehearsalTotal = {
  count: number;
  minutes: number;
};

export type Rehearsal = {
  id: string;
  profileId: string;
  workDate: string;
  startsAt: string | null;
  endsAt: string | null;
  count: number | null;
  name: string | null;
};
