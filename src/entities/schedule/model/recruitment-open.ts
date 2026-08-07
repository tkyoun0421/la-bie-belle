import { z } from "zod";

import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

export const RECRUITMENT_OPEN_DATES_MAX = 366;

const DATE_FORMAT_MESSAGE = "날짜 형식이 올바르지 않아요";
const DATES_REQUIRED_MESSAGE = "근무일을 1개 이상 선택해 주세요";
const DATES_MAX_MESSAGE = `근무일은 한 번에 ${RECRUITMENT_OPEN_DATES_MAX}개까지 선택할 수 있어요`;
const DEADLINE_FORMAT_MESSAGE = "마감일 형식이 올바르지 않아요";

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const CalendarDateSchema = z.string().refine(isValidCalendarDate, DATE_FORMAT_MESSAGE);

export const RecruitmentOpenInputSchema = z.object({
  dates: z
    .array(CalendarDateSchema)
    .min(1, DATES_REQUIRED_MESSAGE)
    .transform((dates) => Array.from(new Set(dates)))
    .refine((dates) => dates.length <= RECRUITMENT_OPEN_DATES_MAX, DATES_MAX_MESSAGE),
  applicationDeadline: z.string().refine(isValidCalendarDate, DEADLINE_FORMAT_MESSAGE),
});

export type RecruitmentOpenInput = z.infer<typeof RecruitmentOpenInputSchema>;

const FORBIDDEN_PG_CODE = "42501";
const CONFLICT_PG_CODE = "23505";
const VALIDATION_PG_CODES = new Set(["LB021", "23514", "22023"]);

export function mapRecruitmentRpcErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.COMMON_FORBIDDEN;
  }
  if (pgCode === CONFLICT_PG_CODE) {
    return ERROR_CODE.SCHEDULING_DATE_CONFLICT;
  }
  if (pgCode !== undefined && VALIDATION_PG_CODES.has(pgCode)) {
    return ERROR_CODE.SCHEDULING_VALIDATION;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}
