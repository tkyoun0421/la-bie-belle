import { z } from "zod";

import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

export const APPLICATION_CHANGES_MAX = 366;

const REQUIRED_MESSAGE = "변경할 날짜를 선택해 주세요";
const MAX_MESSAGE = `한 번에 ${APPLICATION_CHANGES_MAX}개까지 변경할 수 있어요`;
const INTERSECTION_MESSAGE = "같은 날짜를 신청과 철회에 동시에 포함할 수 없어요";

function dedupe(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

const ScheduleIdArraySchema = z.array(z.string().uuid()).transform(dedupe);

export const ApplicationChangesInputSchema = z
  .object({
    applyScheduleIds: ScheduleIdArraySchema,
    withdrawScheduleIds: ScheduleIdArraySchema,
  })
  .refine((value) => value.applyScheduleIds.length + value.withdrawScheduleIds.length > 0, {
    message: REQUIRED_MESSAGE,
    path: ["applyScheduleIds"],
  })
  .refine(
    (value) =>
      value.applyScheduleIds.length + value.withdrawScheduleIds.length <= APPLICATION_CHANGES_MAX,
    { message: MAX_MESSAGE, path: ["applyScheduleIds"] },
  )
  .refine(
    (value) => {
      const withdrawSet = new Set(value.withdrawScheduleIds);
      return value.applyScheduleIds.every((id) => !withdrawSet.has(id));
    },
    { message: INTERSECTION_MESSAGE, path: ["applyScheduleIds"] },
  );

export type ApplicationChangesInput = z.infer<typeof ApplicationChangesInputSchema>;

const FORBIDDEN_PG_CODE = "42501";
const BLOCKED_PG_CODE = "23505";
const VALIDATION_PG_CODE = "22023";

export function mapApplicationRpcErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  if (pgCode === BLOCKED_PG_CODE) {
    return ERROR_CODE.SCHEDULING_APPLICATION_BLOCKED;
  }
  if (pgCode === VALIDATION_PG_CODE) {
    return ERROR_CODE.SCHEDULING_VALIDATION;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}
