import type { DB } from "@/shared/api/database";
import {
  CHECK_IN_COLUMNS,
  EXCUSE_STATUS_COLUMNS,
  type CheckInRow,
  type ExcuseStatusRow,
} from "@/entities/attendance/api/attendance.dto";
import type { Attendance } from "@/entities/attendance/model/attendance.type";
import {
  toCheckIn,
  toExcuseStatus,
} from "@/entities/attendance/utils/attendance.mapper";

const EMPTY: Attendance = { checkIns: [], excuseStatuses: [] };

export async function getDayAttendance(
  client: DB,
  workDate: string,
): Promise<Attendance> {
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
    checkIns: (checkIns.data ?? []).map(toCheckIn),
    excuseStatuses: (excuseStatuses.data ?? []).map(toExcuseStatus),
  };
}
