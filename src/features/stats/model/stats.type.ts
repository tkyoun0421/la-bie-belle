import type {
  ScheduleAssignment,
  ScheduleDay,
} from "@/entities/schedule/model/schedule.type";

export type WorkAssignment = Pick<
  ScheduleAssignment,
  "id" | "profileId" | "position" | "kind" | "endedAt"
> & {
  dayId: string;
  displayName: string;
};

export type WorkDay = Pick<
  ScheduleDay,
  "id" | "workDate" | "startsAt" | "endsAt"
>;

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
