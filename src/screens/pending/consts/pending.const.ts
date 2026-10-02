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

/**
 * 승인 대기 화면 알림 영역의 문안과 정해진 값이다. 정본은
 * `docs/2-design/modules/account/screens/login.md`의 「승인 대기 문안」이고 모습 셋은 같은
 * 문서의 「알림 영역의 세 모습」이다. 어느 모습인지를 정하는 것은
 * [`model`](../model/notificationPrompt.policy.ts)이고 여기는 값만 든다.
 *
 * **켠 사람에게만 약속한다.** 아직 안 켠 모습은 묻기만 하고, 켠 뒤에야 「알려드릴게요」라고
 * 적는다 — 안 켠 사람에게 앱이 알려줄 길이 없다.
 *
 * **버튼은 첫 모습에만 있다.** 거부한 뒤에 버튼을 그대로 두면 눌러도 아무 일이 안 일어난다
 * ([NTF-027](../../../../docs/2-design/modules/notification/README.md#ntf-027)).
 *
 * **거부한 뒤 문장을 여기서 짓지 않는다.** 「나」 화면의 알림 안내와 같은 문장이라
 * `entities/notification`이 들고 있는 것을 가져다 쓴다 — 두 벌로 두면 한쪽만 고쳐진다.
 */

/**
 * 물어본 뒤에도 「안 물어본 상태」로 남았다는 것은 기기가 물음 자체를 못 띄웠다는 뜻이다 —
 * 사람이 거부한 것과 다르지만 켜는 길이 기기 설정뿐인 것은 같아서 같은 모습으로 간다.
 */
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

/**
 * 장면 넷의 문안과 정해진 값이다. 정본은
 * `docs/2-design/modules/account/screens/login.md`다.
 */
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
  /**
   * **같은 글자가 저장소 여섯 자리에 있다.** 묶음 다섯에 걸려 한 열이 못 접고 AC-13이
   * 받는다.
   */
  submitFailed: "보내지 못했어요. 다시 시도해주세요",
  submit: "보내기",
} as const;

/** 성별 칸의 선택지다 — 순서가 화면에 서는 순서다. */
export const GENDER_OPTIONS = [
  { value: "female", label: "여" },
  { value: "male", label: "남" },
] as const;

/** 기다리는 중과 거절된 뒤의 문안이다. */
export const PENDING_WAIT_COPY = {
  waitingBadge: "승인 기다리는 중",
  waitingTitle: "관리자가 확인 중이에요",
  rejectedBadge: "아직 연결 전",
  rejectedTitle: "이번엔 연결이 안 됐어요",
  rejectedSubline: "프로필을 고쳐서 다시 보낼 수 있어요",
  retry: "다시 보내기",
} as const;

/** 기다리는 동안 번갈아 서는 줄이다 — 앱이 무엇을 해 주는지를 말한다. */
export const ROTATING_LINES = [
  "이번 달 근무표를 한눈에 봐요",
  "출근은 현장에서 찍어요",
  "일한 시간과 급여를 같이 봐요",
] as const;

export const ROTATE_INTERVAL_MS = 4000;

/** 축하가 머무는 시간이다 — 지나면 저절로 승인 대기로 넘어간다. */
export const CELEBRATION_STAY_MS = 1200;

export const PENDING_AVATAR_SIZE = 64;

export const EMAIL_AVATAR_SIZE = 24;

export const SCREEN_BOTTOM_PADDING = 24;

/** 칸이 받는 자릿수다 — 둘 다 하이픈 없는 숫자다. */
export const BIRTH_DATE_LENGTH = 8;

export const PENDING_PHONE_LENGTH = 11;
