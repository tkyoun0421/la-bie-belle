import type { ScheduleDay } from "@/entities/schedule/model/schedule.type";

export function liveAssignmentCount(day: ScheduleDay): number {
  return day.assignments.filter((assignment) => assignment.endedAt === null)
    .length;
}
