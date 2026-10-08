import type {
  CheckInRow,
  ExcuseStatusRow,
} from "@/entities/attendance/api/attendance.dto";
import { EXCUSE_DECISIONS } from "@/entities/attendance/consts/attendance.const";
import type {
  CheckIn,
  ExcuseDecision,
  ExcuseStatus,
} from "@/entities/attendance/model/attendance.type";

export function toCheckIn(row: CheckInRow): CheckIn {
  return {
    id: row.id,
    dayId: row.day_id,
    profileId: row.profile_id,
    checkedAt: row.checked_at,
    reportedAt: row.reported_at,
    receivedAt: row.received_at,
    method: row.method,
  };
}

export function toExcuseStatus(row: ExcuseStatusRow): ExcuseStatus {
  return {
    dayId: row.day_id,
    profileId: row.profile_id,
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    decision: decisionOf(row.decision),
  };
}

function decisionOf(decision: string | null): ExcuseDecision | null {
  return decision !== null &&
    (EXCUSE_DECISIONS as readonly string[]).includes(decision)
    ? (decision as ExcuseDecision)
    : null;
}
