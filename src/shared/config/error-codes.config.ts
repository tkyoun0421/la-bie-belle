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
} as const satisfies Record<string, ErrorSpec>;

export type ErrorCode = keyof typeof ERROR_CODES;
