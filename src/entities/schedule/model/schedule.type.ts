import { type POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";

export type Position = (typeof POSITION_ORDER)[number];

export type MonthWindow = {
  applicationDeadline: string | null;
  confirmedAt: string | null;
};
