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
  IDENTITY_STATUS_CONFLICT: {
    http: 409,
    message: "상태가 이미 바뀌었어요. 새로고침 후 다시 확인해 주세요",
  },
  SCHEDULING_DATE_CONFLICT: {
    http: 409,
    message: "이미 모집 중인 날짜가 있어요. 목록을 다시 확인해 주세요",
  },
  SCHEDULING_VALIDATION: { http: 422, message: "입력값을 다시 확인해 주세요" },
  SCHEDULING_APPLICATION_BLOCKED: {
    http: 409,
    message: "신청할 수 없는 날짜가 있어요. 목록을 다시 확인해 주세요",
  },
  SCHEDULING_STATUS_CONFLICT: {
    http: 409,
    message: "상태가 이미 바뀌었어요. 새로고침 후 다시 확인해 주세요",
  },
  SCHEDULING_POSITION_IN_USE: {
    http: 409,
    message: "필요 인원에 쓰이고 있는 포지션이에요. 비활성화해 주세요",
  },
  SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE: {
    http: 409,
    message: "선택한 인원 중 이 포지션에 배정할 수 없는 사람이 있어요",
  },
  SCHEDULING_TRAINEE_ALREADY_ASSIGNED: {
    http: 409,
    message: "이미 다른 포지션에 정식 배정되었거나 교육생으로 등록된 사람이 있어요",
  },
  SCHEDULING_TRAINEE_DUPLICATE: {
    http: 409,
    message: "이미 다른 포지션의 교육생으로 등록된 사람이 있어요",
  },
  SCHEDULING_CONFIRM_NO_CEREMONY: { http: 409, message: "예식을 먼저 만들어 주세요" },
  SCHEDULING_CONFIRM_NO_PLANNED_TIME: {
    http: 409,
    message: "예정 출퇴근 시각을 먼저 설정해 주세요",
  },
  SCHEDULING_CONFIRM_NO_REQUIREMENTS: { http: 409, message: "필요 인원 표를 먼저 열어 주세요" },
  SCHEDULING_CONFIRM_INVALID_STATUS: { http: 409, message: "확정할 수 없는 상태예요" },
  SCHEDULING_CONFIRM_MISSING_WAGE: {
    http: 409,
    message: "시급이 설정되지 않은 근무자가 있어요",
  },
  SCHEDULING_ROSTER_NOT_CONFIRMED: { http: 409, message: "아직 확정되지 않은 스케줄이에요" },
  SCHEDULING_CANCEL_INVALID_STATUS: { http: 409, message: "취소할 수 없는 상태예요" },
  SCHEDULING_REVISION_NO_CEREMONY: {
    http: 409,
    message: "확정된 스케줄에는 예식이 하나 이상 필요해요",
  },
  SCHEDULING_REVISION_LAST_REQUIREMENT: {
    http: 409,
    message: "확정된 스케줄에는 필요 인원 표가 필요해요",
  },
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
  IDENTITY_STATUS_CONFLICT: "IDENTITY_STATUS_CONFLICT",
  SCHEDULING_DATE_CONFLICT: "SCHEDULING_DATE_CONFLICT",
  SCHEDULING_VALIDATION: "SCHEDULING_VALIDATION",
  SCHEDULING_APPLICATION_BLOCKED: "SCHEDULING_APPLICATION_BLOCKED",
  SCHEDULING_STATUS_CONFLICT: "SCHEDULING_STATUS_CONFLICT",
  SCHEDULING_POSITION_IN_USE: "SCHEDULING_POSITION_IN_USE",
  SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE: "SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE",
  SCHEDULING_TRAINEE_ALREADY_ASSIGNED: "SCHEDULING_TRAINEE_ALREADY_ASSIGNED",
  SCHEDULING_TRAINEE_DUPLICATE: "SCHEDULING_TRAINEE_DUPLICATE",
  SCHEDULING_CONFIRM_NO_CEREMONY: "SCHEDULING_CONFIRM_NO_CEREMONY",
  SCHEDULING_CONFIRM_NO_PLANNED_TIME: "SCHEDULING_CONFIRM_NO_PLANNED_TIME",
  SCHEDULING_CONFIRM_NO_REQUIREMENTS: "SCHEDULING_CONFIRM_NO_REQUIREMENTS",
  SCHEDULING_CONFIRM_INVALID_STATUS: "SCHEDULING_CONFIRM_INVALID_STATUS",
  SCHEDULING_CONFIRM_MISSING_WAGE: "SCHEDULING_CONFIRM_MISSING_WAGE",
  SCHEDULING_ROSTER_NOT_CONFIRMED: "SCHEDULING_ROSTER_NOT_CONFIRMED",
  SCHEDULING_CANCEL_INVALID_STATUS: "SCHEDULING_CANCEL_INVALID_STATUS",
  SCHEDULING_REVISION_NO_CEREMONY: "SCHEDULING_REVISION_NO_CEREMONY",
  SCHEDULING_REVISION_LAST_REQUIREMENT: "SCHEDULING_REVISION_LAST_REQUIREMENT",
} as const satisfies { [K in ErrorCode]: K };
