import {
  PUSH_DENIED_SUBLINE,
  PUSH_DENIED_TITLE,
} from "@/entities/notification/consts/notification.const";
import type { PushPermission } from "@/entities/notification/model/reachState.policy";
import type {
  NotificationPromptCopy,
  NotificationPromptOutcome,
  NotificationPromptView,
} from "@/screens/pending/model/notificationPrompt.policy";

export const PROMPT_OUTCOME_OF: Record<
  PushPermission,
  NotificationPromptOutcome
> = {
  granted: "granted",
  denied: "denied",
  undetermined: "unsupported",
};

export const INITIAL_NOTIFICATION_PROMPT_VIEW: NotificationPromptView = "idle";

export const NOTIFICATION_PROMPT_BUTTON = "알림 켜기";

export const NOTIFICATION_PROMPT_COPY: Record<
  NotificationPromptView,
  NotificationPromptCopy
> = {
  idle: {
    title: "승인되면 알려드릴까요?",
    subline: "알림을 켜두면 앱을 안 열어도 알 수 있어요",
    hasButton: true,
  },
  enabled: {
    title: "승인되면 알려드릴게요",
    subline: "알림은 설정에서 언제든 끌 수 있어요",
    hasButton: false,
  },
  denied: {
    title: PUSH_DENIED_TITLE,
    subline: PUSH_DENIED_SUBLINE,
    hasButton: false,
  },
};

export const PENDING_FORM_COPY = {
  appBarTitle: "프로필",
  signOut: "로그아웃",
  writing: "자신의 프로필을 작성해 주세요",
  reviewing: "아래 정보가 맞나요? 틀린 부분을 누르면 다시 적을 수 있어요",
  greetingSuffix: "님, 반가워요",
  useDefaultPhoto: "기본 사진 쓰기",
  photoFailed: "사진을 올리지 못했어요. 다시 골라 주세요",
  nameLabel: "이름",
  namePlaceholder: "근무표에 뜰 이름",
  genderLabel: "성별",
  birthDateLabel: "생년월일",
  birthDatePlaceholder: "19930421",
  phoneLabel: "연락처",
  phonePlaceholder: "010-0000-0000",
  lockedNote: "이름과 성별과 생년월일은 보내고 나면 못 고쳐요",
  submitHint: "빈 칸을 다 채우면 보낼 수 있어요",
  submitFailed: "보내지 못했어요. 다시 시도해주세요",
  submit: "보내기",
} as const;

export const GENDER_OPTIONS = [
  { value: "female", label: "여" },
  { value: "male", label: "남" },
] as const;

export const PENDING_WAIT_COPY = {
  waitingBadge: "승인 기다리는 중",
  waitingTitle: "관리자가 확인 중이에요",
  rejectedBadge: "아직 연결 전",
  rejectedTitle: "이번엔 연결이 안 됐어요",
  rejectedSubline: "프로필을 고쳐서 다시 보낼 수 있어요",
  retry: "다시 보내기",
} as const;

export const ROTATING_LINES = [
  "이번 달 근무표를 한눈에 봐요",
  "출근은 현장에서 찍어요",
  "일한 시간과 급여를 같이 봐요",
] as const;

export const ROTATE_INTERVAL_MS = 4000;

export const CELEBRATION_STAY_MS = 1200;

export const PENDING_AVATAR_SIZE = 64;

export const EMAIL_AVATAR_SIZE = 24;

export const SCREEN_BOTTOM_PADDING = 24;

export const BIRTH_DATE_LENGTH = 8;

export const PENDING_PHONE_LENGTH = 11;
