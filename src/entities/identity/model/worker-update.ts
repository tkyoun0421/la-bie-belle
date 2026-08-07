import { z } from "zod";

import { GENDER_VALUES } from "@/entities/identity/model/signup";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";
import { HOURLY_WAGE_MAX, HOURLY_WAGE_MIN } from "@/shared/config/wage.config";

const PHONE_PATTERN = /^01[0-9]{8,9}$/;
const NAME_REQUIRED_MESSAGE = "이름을 입력해 주세요";
const PHONE_FORMAT_MESSAGE = "휴대폰 번호 형식이 올바르지 않아요";
const GENDER_REQUIRED_MESSAGE = "성별을 선택해 주세요";
const BIRTH_DATE_FORMAT_MESSAGE = "생년월일을 확인해 주세요";
const BIRTH_DATE_FUTURE_MESSAGE = "생년월일은 오늘 이후일 수 없어요";
const HOURLY_WAGE_RANGE_MESSAGE = `시급은 ${HOURLY_WAGE_MIN}원 이상 ${HOURLY_WAGE_MAX.toLocaleString("ko-KR")}원 이하로 입력해 주세요`;

const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

export const PHONE_UNIQUE_CONSTRAINT = "profiles_phone_key";

function seoulDateOnly(date: Date): string {
  return SEOUL_DATE_FORMATTER.format(date);
}

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function createWorkerPersonalInfoSchema(now: Date = new Date()) {
  const today = seoulDateOnly(now);

  return z.object({
    name: z.string().trim().min(1, NAME_REQUIRED_MESSAGE),
    phone: z.string().regex(PHONE_PATTERN, PHONE_FORMAT_MESSAGE),
    gender: z.enum(GENDER_VALUES, GENDER_REQUIRED_MESSAGE),
    birthDate: z
      .string()
      .refine(isValidCalendarDate, BIRTH_DATE_FORMAT_MESSAGE)
      .refine((value) => value <= today, BIRTH_DATE_FUTURE_MESSAGE),
  });
}

export type WorkerPersonalInfoInput = z.infer<ReturnType<typeof createWorkerPersonalInfoSchema>>;
export type WorkerPersonalInfoFieldName = keyof WorkerPersonalInfoInput;

export function toWorkerPersonalInfoFieldErrors(
  error: z.ZodError,
): Partial<Record<WorkerPersonalInfoFieldName, string>> {
  const fieldErrors: Partial<Record<WorkerPersonalInfoFieldName, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as WorkerPersonalInfoFieldName] = issue.message;
    }
  }
  return fieldErrors;
}

export const OwnPhoneSchema = z.object({
  phone: z.string().regex(PHONE_PATTERN, PHONE_FORMAT_MESSAGE),
});

export const HourlyWageSchema = z.object({
  hourlyWage: z.coerce
    .number(HOURLY_WAGE_RANGE_MESSAGE)
    .int(HOURLY_WAGE_RANGE_MESSAGE)
    .min(HOURLY_WAGE_MIN, HOURLY_WAGE_RANGE_MESSAGE)
    .max(HOURLY_WAGE_MAX, HOURLY_WAGE_RANGE_MESSAGE),
});

const FORBIDDEN_PG_CODE = "42501";
const VALIDATION_PG_CODES = new Set(["LB001", "LB002"]);

export function mapWorkerRpcErrorCode(pgCode: string | undefined): ErrorCode {
  if (pgCode === FORBIDDEN_PG_CODE) {
    return ERROR_CODE.COMMON_FORBIDDEN;
  }
  if (pgCode !== undefined && VALIDATION_PG_CODES.has(pgCode)) {
    return ERROR_CODE.IDENTITY_VALIDATION;
  }
  return ERROR_CODE.COMMON_UNEXPECTED;
}
