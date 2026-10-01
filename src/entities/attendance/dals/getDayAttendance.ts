import type { Db } from "@/shared/api/database";

export type CheckInRow = {
  id: string;
  day_id: string;
  profile_id: string;
  checked_at: string;
  reported_at: string;
  received_at: string;
  method: string;
};

export type ExcuseStatusRow = {
  day_id: string;
  profile_id: string;
  submitted_at: string;
  decided_at: string | null;
  decision: string | null;
};

export type DayAttendance = {
  checkIns: CheckInRow[];
  excuseStatuses: ExcuseStatusRow[];
};

const CHECK_IN_COLUMNS = [
  "id",
  "day_id",
  "profile_id",
  "checked_at",
  "reported_at",
  "received_at",
  "method",
].join(", ");

const EXCUSE_STATUS_COLUMNS = [
  "day_id",
  "profile_id",
  "submitted_at",
  "decided_at",
  "decision",
].join(", ");

const EMPTY: DayAttendance = { checkIns: [], excuseStatuses: [] };

export function dayAttendanceKey(workDate: string): string[] {
  return ["attendance", workDate];
}

export async function getDayAttendance(
  client: Db,
  workDate: string,
): Promise<DayAttendance> {
  const { data: day, error: dayError } = await client
    .from("days")
    .select("id")
    .eq("work_date", workDate)
    .maybeSingle<{ id: string }>();

  if (dayError) {
    throw dayError;
  }
  if (day === null) {
    return EMPTY;
  }

  const [checkIns, excuseStatuses] = await Promise.all([
    client
      .from("check_ins")
      .select(CHECK_IN_COLUMNS)
      .eq("day_id", day.id)
      .returns<CheckInRow[]>(),
    client
      .from("excuse_status")
      .select(EXCUSE_STATUS_COLUMNS)
      .eq("day_id", day.id)
      .returns<ExcuseStatusRow[]>(),
  ]);

  if (checkIns.error) {
    throw checkIns.error;
  }
  if (excuseStatuses.error) {
    throw excuseStatuses.error;
  }

  return {
    checkIns: checkIns.data ?? [],
    excuseStatuses: excuseStatuses.data ?? [],
  };
}
