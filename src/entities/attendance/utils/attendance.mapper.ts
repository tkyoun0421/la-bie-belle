import type {
  CheckInRow,
  ExcuseStatusRow,
} from "@/entities/attendance/api/attendance.dto";
import type {
  CheckIn,
  ExcuseStatus,
} from "@/entities/attendance/model/attendance.type";
import { isExcuseDecision } from "@/entities/attendance/model/excuseDecision.policy";

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
    decision: isExcuseDecision(row.decision) ? row.decision : null,
  };
}
