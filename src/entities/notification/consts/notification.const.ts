import type {
  PushPermission,
  ReachState,
} from "@/entities/notification/model/reachState.policy";

export const NOTIFICATION_KINDS = [
  "signup_approved",
  "requests_open",
  "deadline_changed",
  "schedule_confirmed",
  "assignment_added",
  "assignment_removed",
  "shift_reminder",
  "weekend_reminder",
  "before_shift",
  "work_requested",
  "work_request_accepted",
  "work_request_exhausted",
  "cancel_requested",
  "cancel_approved",
  "cancel_rejected",
  "excuse_approved",
  "excuse_rejected",
  "vacancy_nudge",
  "admin_notice",
  "swap_requested",
  "swap_accepted",
  "swap_approved",
  "swap_exhausted",
] as const;

export const ADMIN_NOTICE: (typeof NOTIFICATION_KINDS)[number] = "admin_notice";

export const NOTIFICATION_PAGE_SIZE = 50;

export const NOTIFICATION_MAX_PAGES = 3;

export const PERMISSION_OF_OTHERS: PushPermission = "granted";

export const REACHABLE: ReachState = "reachable";

export const PUSH_MESSAGES_PER_REQUEST = 100;

export const PUSH_DENIED_TITLE = "알림이 꺼져 있어요";

export const PUSH_DENIED_SUBLINE = "기기 설정에서 알림을 켜면 받을 수 있어요";

export const UNREACHABLE_STATES: ReadonlySet<ReachState> = new Set<ReachState>([
  "off",
  "no-device",
]);

export const REACH_LIST_SUFFIX: Partial<Record<ReachState, string>> = {
  off: "· 알림 꺼둠",
  "no-device": "· 기기 안 연결",
};

export const REACH_SHEET_LINE: Partial<Record<ReachState, string>> = {
  off: "알림을 꺼두었어요",
  "no-device": "기기에서 알림을 꺼서 안 가요",
};
