import { memberOf } from "@/shared/model/memberOf.policy";
import { EXCUSE_DECISIONS } from "@/entities/attendance/consts/attendance.const";

export const isExcuseDecision = memberOf(EXCUSE_DECISIONS);
