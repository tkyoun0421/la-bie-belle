export type ErrorDomain =
  "IDENTITY" | "SCHEDULING" | "ATTENDANCE" | "NOTIFICATIONS" | "PAY" | "COMMON";

export type ErrorSpec = {
  http: number;
  message: string;
};

export const ERROR_CODES = {
  COMMON_AUTH_REQUIRED: { http: 401, message: "로그인이 필요해요" },
  COMMON_FORBIDDEN: { http: 403, message: "접근 권한이 없어요" },
  COMMON_NOT_FOUND: { http: 404, message: "요청한 정보를 찾을 수 없어요" },
  COMMON_UNEXPECTED: {
    http: 500,
    message: "일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요",
  },
  IDENTITY_VALIDATION: { http: 422, message: "입력값을 다시 확인해 주세요" },
  IDENTITY_PROFILE_EXISTS: { http: 409, message: "이미 가입 절차를 진행했어요" },
  IDENTITY_PHONE_TAKEN: { http: 409, message: "이미 가입된 휴대폰 번호예요" },
  IDENTITY_PROFILE_REQUIRED: { http: 403, message: "가입을 먼저 완료해 주세요" },
  IDENTITY_NOT_ACTIVE: { http: 403, message: "승인 후 이용할 수 있어요" },
  IDENTITY_ALREADY_PROCESSED: { http: 409, message: "이미 처리된 신청이에요" },
} as const satisfies Record<`${ErrorDomain}_${string}`, ErrorSpec>;

export type ErrorCode = keyof typeof ERROR_CODES;

export const ERROR_CODE = {
  COMMON_AUTH_REQUIRED: "COMMON_AUTH_REQUIRED",
  COMMON_FORBIDDEN: "COMMON_FORBIDDEN",
  COMMON_NOT_FOUND: "COMMON_NOT_FOUND",
  COMMON_UNEXPECTED: "COMMON_UNEXPECTED",
  IDENTITY_VALIDATION: "IDENTITY_VALIDATION",
  IDENTITY_PROFILE_EXISTS: "IDENTITY_PROFILE_EXISTS",
  IDENTITY_PHONE_TAKEN: "IDENTITY_PHONE_TAKEN",
  IDENTITY_PROFILE_REQUIRED: "IDENTITY_PROFILE_REQUIRED",
  IDENTITY_NOT_ACTIVE: "IDENTITY_NOT_ACTIVE",
  IDENTITY_ALREADY_PROCESSED: "IDENTITY_ALREADY_PROCESSED",
} as const satisfies { [K in ErrorCode]: K };
