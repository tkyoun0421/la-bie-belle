import type { DB } from "@/shared/api/database";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type {
  MonthWindowRow,
  ScheduleDay,
} from "@/entities/schedule/api/schedule.dto";
import type { MonthWindow } from "@/entities/schedule/model/schedule.type";
import { toMonthWindow } from "@/entities/schedule/utils/monthWindow.mapper";

const DAY_COLUMNS = [
  "id",
  "work_date",
  "starts_at",
  "ends_at",
  "opened_at",
  "slots(id, positions, ended_at)",
  "assignments(id, slot_id, position, kind, profile_id, ended_at, profiles!assignments_profile_id_fkey(display_name))",
  "check_ins(id, profile_id, checked_at, reported_at, received_at)",
].join(", ");

export async function getMonthSchedule(
  client: DB,
  month: string,
): Promise<ScheduleDay[]> {
  const { data, error } = await client
    .from("days")
    .select(DAY_COLUMNS)
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month))
    .order("work_date")
    .order("created_at", { referencedTable: "slots" })
    .returns<ScheduleDay[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getMonthWindow(
  client: DB,
  month: string,
): Promise<MonthWindow | null> {
  const { data, error } = await client
    .from("schedules")
    .select("application_deadline, confirmed_at")
    .eq("month", monthStart(month))
    .maybeSingle<MonthWindowRow>();

  if (error) {
    throw error;
  }

  return data === null ? null : toMonthWindow(data);
}

export function liveAssignmentCount(day: ScheduleDay): number {
  return day.assignments.filter((assignment) => assignment.ended_at === null)
    .length;
}
