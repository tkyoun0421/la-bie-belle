import { z } from "zod";

import { isValidCalendarDate } from "@/entities/schedule/model/recruitment-open";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

const DEADLINE_FORMAT_MESSAGE = "마감일 형식이 올바르지 않아요";

export const RecruitmentManageInputSchema = z.object({
  scheduleId: z.string().uuid(),
  newDeadline: z.string().refine(isValidCalendarDate, DEADLINE_FORMAT_MESSAGE),
});

export type RecruitmentManageInput = z.infer<typeof RecruitmentManageInputSchema>;

const FORBIDDEN_PG_CODE = "42501";
const STATUS_CONFLICT_PG_CODES = new Set(["22023", "LB020"]);
const VALIDATION_PG_CODES = new Set(["LB021", "23514"]);

export function mapRecruitmentManageRpcErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.COMMON_FORBIDDEN;
  }
  if (pgCode !== undefined && STATUS_CONFLICT_PG_CODES.has(pgCode)) {
    return ERROR_CODE.SCHEDULING_STATUS_CONFLICT;
  }
  if (pgCode !== undefined && VALIDATION_PG_CODES.has(pgCode)) {
    return ERROR_CODE.SCHEDULING_VALIDATION;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}
