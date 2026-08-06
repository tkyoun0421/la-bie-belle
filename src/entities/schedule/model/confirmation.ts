import type { AssignmentRosterRow } from "@/entities/schedule/model/assignment";

export type ScheduleConfirmation = {
  date: string;
  revision: number;
  scheduledStart: string;
  scheduledEnd: string;
  ceremonyTime: string;
  roster: AssignmentRosterRow[];
  changeSummary?: string;
};
