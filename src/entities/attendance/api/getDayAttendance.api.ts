import type { DB } from "@/shared/api/database";

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

/**
 * 날 키와 달 키가 같은 모양을 낸다 — 상태 여섯을 내는 순수 함수가 두 키 위에서 그대로
 * 돈다. 꼴이 갈리면 그 함수가 두 벌 서야 한다.
 */
export type AttendanceRows = {
  checkIns: CheckInRow[];
  excuseStatuses: ExcuseStatusRow[];
};

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
