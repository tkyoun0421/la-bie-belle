import type { DB } from "@/shared/api/database";
import type {
  CheckInRow,
  ExcuseStatusRow,
} from "@/entities/attendance/dals/getDayAttendance";

/**
 * 그달치 인증과 사유다. 키가 `['attendance', 'YYYY-MM']`이고 날 키
 * ([`getDayAttendance.ts`](getDayAttendance.ts))와 같은 모양을 낸다 — 상태 여섯을 내는
 * 순수 함수가 두 키 위에서 그대로 돈다. **상태 계산을 여기서 다시 짜지 않는다.**
 *
 * **한 달을 날마다 읽지 않는다.** 서른 명 규모에서 한 달이면 수백 행이라 그것을 서른 번에
 * 나눠 묻는 것이 더 비싸다(`docs/2-design/system/runtime.md`의 「읽기 범위」). 그달에 연 날을
 * 먼저 집고 그 날들로 표 둘을 각각 한 번씩 읽는다.
 *
 * 달의 경계를 여기서 재는 것은 `entities/schedule`을 못 불러서다(lint 규칙 3) — 같은 계산이
 * `getMonthSchedule.ts`에도 있다.
 */

export type MonthAttendance = {
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

const EMPTY: MonthAttendance = { checkIns: [], excuseStatuses: [] };

export async function getMonthAttendance(
  client: DB,
  month: string,
): Promise<MonthAttendance> {
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
    checkIns: checkIns.data ?? [],
    excuseStatuses: excuseStatuses.data ?? [],
  };
}

/** `"2026-12"`도 `"2026-12-25"`도 `"2026-12-01"`이다. */
function monthStart(month: string): string {
  return `${month.slice(0, 7)}-01`;
}

/** `"2026-12"`의 다음은 `"2027-01-01"`이다. */
function nextMonthStart(month: string): string {
  const [year, index] = month.slice(0, 7).split("-").map(Number);
  const rolls = index === 12;

  return [
    String(rolls ? year + 1 : year).padStart(4, "0"),
    String(rolls ? 1 : index + 1).padStart(2, "0"),
    "01",
  ].join("-");
}
