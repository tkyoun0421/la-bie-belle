import type { DB } from "@/shared/api/database";
import type {
  AttendanceRows,
  CheckInRow,
  ExcuseStatusRow,
} from "@/entities/attendance/api/attendance.dto";

export const CHECK_IN_COLUMNS = [
  "id",
  "day_id",
  "profile_id",
  "checked_at",
  "reported_at",
  "received_at",
  "method",
].join(", ");

export const EXCUSE_STATUS_COLUMNS = [
  "day_id",
  "profile_id",
  "submitted_at",
  "decided_at",
  "decision",
].join(", ");

const EMPTY: AttendanceRows = { checkIns: [], excuseStatuses: [] };

export async function getDayAttendance(
  client: DB,
  workDate: string,
): Promise<AttendanceRows> {
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
