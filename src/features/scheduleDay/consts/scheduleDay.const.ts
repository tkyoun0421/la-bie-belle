import { TRANSPORT_ERROR_COPY } from "@/shared/consts/error.const";

export const SCHEDULE_DAY_COPY = {
  saveFailed: TRANSPORT_ERROR_COPY,
  closeDayTitleSuffix: "을 닫을까요?",
  createTitleSuffix: " 근무표 만들기",
  createNoticePrefix: "만드는 순간 ",
  createNoticeSuffix: " 근무 신청 접수가 열리고, 근무자 전원에게 알림이 가요",
} as const;
