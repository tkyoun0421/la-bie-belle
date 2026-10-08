import { type POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";

export type Position = (typeof POSITION_ORDER)[number];

export type MonthWindow = {
  applicationDeadline: string | null;
  confirmedAt: string | null;
};

export type ScheduleCheckIn = {
  id: string;
  profileId: string;
  checkedAt: string;
  reportedAt: string;
  receivedAt: string;
};

export type ScheduleAssignment = {
  id: string;
  slotId: string | null;
  position: string;
  kind: string;
  profileId: string;
  endedAt: string | null;
  name: string | null;
};

export type ScheduleSlot = {
  id: string;
  positions: string[];
  endedAt: string | null;
};

export type ScheduleDay = {
  id: string;
  workDate: string;
  startsAt: string;
  endsAt: string;
  openedAt: string;
  slots: ScheduleSlot[];
  assignments: ScheduleAssignment[];
  checkIns: ScheduleCheckIn[];
};

export type OpenSlot = {
  slotId: string;
  dayId: string;
  workDate: string;
  positions: string[];
};
