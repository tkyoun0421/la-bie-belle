import type { DB } from "@/shared/api/database";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
import type {
  CheckInRow,
  ExcuseStatusRow,
} from "@/entities/attendance/api/attendance.dto";
import {
  CHECK_IN_COLUMNS,
  EXCUSE_STATUS_COLUMNS,
} from "@/entities/attendance/api/getDayAttendance.api";
import type { Attendance } from "@/entities/attendance/model/attendance.type";
import {
  toCheckIn,
  toExcuseStatus,
} from "@/entities/attendance/utils/attendance.mapper";

const EMPTY: Attendance = { checkIns: [], excuseStatuses: [] };

export async function getMonthAttendance(
  client: DB,
  month: string,
): Promise<Attendance> {
  const { data: days, error: daysError } = await client
    .from("days")
    .select("id")
    .gte("work_date", monthStart(month))
    .lt("work_date", nextMonthStart(month))
    .returns<{ id: string }[]>();

  if (daysError) {
    throw daysError;
  }

  const dayIds = (days ?? []).map((day) => day.id);

  if (dayIds.length === 0) {
    return EMPTY;
  }

  const [checkIns, excuseStatuses] = await Promise.all([
    client
      .from("check_ins")
      .select(CHECK_IN_COLUMNS)
      .in("day_id", dayIds)
      .returns<CheckInRow[]>(),
    client
      .from("excuse_status")
      .select(EXCUSE_STATUS_COLUMNS)
      .in("day_id", dayIds)
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
