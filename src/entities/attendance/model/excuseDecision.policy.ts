import { memberOf } from "@/shared/model/memberOf.policy";
import { EXCUSE_DECISIONS } from "@/entities/attendance/consts/attendance.const";
import type { ExcuseDecision } from "@/entities/attendance/model/attendance.type";

const isExcuseDecision = memberOf(EXCUSE_DECISIONS);

export function excuseDecisionOf(
  decision: string | null,
): ExcuseDecision | null {
  return isExcuseDecision(decision) ? decision : null;
}
