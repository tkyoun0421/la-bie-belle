import { CONFIRMED_ROSTER } from "@/entities/schedule/model/assignment.mock";
import type { ScheduleConfirmation } from "@/entities/schedule/model/confirmation";

export const GENERAL_CONFIRMATION: ScheduleConfirmation = {
  date: "2026-08-09",
  revision: 1,
  scheduledStart: "09:00",
  scheduledEnd: "18:00",
  ceremonyTime: "14:00",
  roster: CONFIRMED_ROSTER,
};

export const CONFIRMED_WITH_CHANGE: ScheduleConfirmation = {
  date: "2026-08-14",
  revision: 2,
  scheduledStart: "09:30",
  scheduledEnd: "18:30",
  ceremonyTime: "14:30",
  roster: CONFIRMED_ROSTER,
  changeSummary: "시작 시간이 30분 당겨졌어요",
};

export const TRAINEE_CONFIRMATION: ScheduleConfirmation = {
  date: "2026-08-16",
  revision: 1,
  scheduledStart: "10:00",
  scheduledEnd: "19:00",
  ceremonyTime: "15:00",
  roster: CONFIRMED_ROSTER,
};
