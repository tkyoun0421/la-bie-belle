import { z } from "zod";

export const GENDER_VALUES = ["male", "female"] as const;

const PHONE_PATTERN = /^01[0-9]{8,9}$/;
const NAME_REQUIRED_MESSAGE = "이름을 입력해 주세요";
const PHONE_FORMAT_MESSAGE = "휴대폰 번호 형식이 올바르지 않아요";
const GENDER_REQUIRED_MESSAGE = "성별을 선택해 주세요";
const BIRTH_DATE_FORMAT_MESSAGE = "생년월일을 확인해 주세요";
const BIRTH_DATE_FUTURE_MESSAGE = "생년월일은 오늘 이후일 수 없어요";

const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

export function normalizePhone(rawPhone: string): string {
  return rawPhone.replace(/[^0-9]/g, "");
}

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

export function createSignupSchema(now: Date = new Date()) {
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

export type SignupInput = z.infer<ReturnType<typeof createSignupSchema>>;
export type SignupFieldName = keyof SignupInput;

export function toSignupFieldErrors(error: z.ZodError): Partial<Record<SignupFieldName, string>> {
  const fieldErrors: Partial<Record<SignupFieldName, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as SignupFieldName] = issue.message;
    }
  }
  return fieldErrors;
}
