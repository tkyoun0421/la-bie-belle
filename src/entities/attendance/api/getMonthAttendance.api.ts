import type { DB } from "@/shared/api/database";
import { readAllPages } from "@/shared/api/readAllPages";
import { monthStart, nextMonthStart } from "@/shared/utils/monthRange";
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

function byDayThenProfile(left: CheckInRow, right: CheckInRow): number {
  const leftKey = `${left.day_id}|${left.profile_id}`;
  const rightKey = `${right.day_id}|${right.profile_id}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

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
    readAllPages(
      (after: string | null, limit) => {
        const query = client
          .from("check_ins")
          .select(CHECK_IN_COLUMNS)
          .in("day_id", dayIds);
        return (after === null ? query : query.gt("id", after))
          .order("id")
          .limit(limit)
          .returns<CheckInRow[]>();
      },
      (row) => row.id,
    ),
    client
      .from("excuse_status")
      .select(EXCUSE_STATUS_COLUMNS)
      .in("day_id", dayIds)
      .returns<ExcuseStatusRow[]>(),
  ]);

  if (excuseStatuses.error) {
    throw excuseStatuses.error;
  }

  return {
    checkIns: checkIns.sort(byDayThenProfile).map(toCheckIn),
    excuseStatuses: (excuseStatuses.data ?? []).map(toExcuseStatus),
  };
}
