import { z } from "zod";

import { CEREMONY_COUNT_MAX, CEREMONY_COUNT_MIN } from "@/entities/schedule/model/ceremony-times";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

const TIME_FORMAT_MESSAGE = "시각 형식이 올바르지 않아요";
const CEREMONY_TIMES_COUNT_MESSAGE = `예식은 ${CEREMONY_COUNT_MIN}개 이상 ${CEREMONY_COUNT_MAX}개 이하여야 해요`;

const TimeStringSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, TIME_FORMAT_MESSAGE);

export const ReplaceCeremoniesInputSchema = z.object({
  scheduleId: z.string().uuid(),
  ceremonyTimes: z
    .array(TimeStringSchema)
    .min(CEREMONY_COUNT_MIN, CEREMONY_TIMES_COUNT_MESSAGE)
    .max(CEREMONY_COUNT_MAX, CEREMONY_TIMES_COUNT_MESSAGE),
});

export type ReplaceCeremoniesInput = z.infer<typeof ReplaceCeremoniesInputSchema>;

export const SetPlannedTimesInputSchema = z.object({
  scheduleId: z.string().uuid(),
  checkin: TimeStringSchema,
  checkout: TimeStringSchema,
});

export type SetPlannedTimesInput = z.infer<typeof SetPlannedTimesInputSchema>;

const FORBIDDEN_PG_CODE = "42501";
const STATUS_CONFLICT_PG_CODE = "LB020";
const VALIDATION_PG_CODE = "22023";

export function mapCeremonyRpcErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.IDENTITY_NOT_ACTIVE;
  }
  if (pgCode === STATUS_CONFLICT_PG_CODE) {
    return ERROR_CODE.SCHEDULING_STATUS_CONFLICT;
  }
  if (pgCode === VALIDATION_PG_CODE) {
    return ERROR_CODE.SCHEDULING_VALIDATION;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}
