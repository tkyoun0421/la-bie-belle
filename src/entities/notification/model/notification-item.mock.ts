import type { NotificationItem } from "@/entities/notification/model/notification-item";

export const MIXED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "noti-1",
    title: "근무 배정이 확정됐어요",
    body: "8월 9일 플로어 근무가 확정됐어요",
    occurredAt: "2026-08-06T09:00:00+09:00",
    read: false,
    target: { screen: "schedule-detail", date: "2026-08-09" },
  },
  {
    id: "noti-2",
    title: "근무 가능일이 마감 임박이에요",
    body: "8월 7일까지 신청할 수 있어요",
    occurredAt: "2026-08-04T18:30:00+09:00",
    read: true,
    target: { screen: "schedule-detail", date: "2026-08-09" },
  },
  {
    id: "noti-3",
    title: "예상 급여가 갱신됐어요",
    body: "이번 달 예상 급여를 확인하세요",
    occurredAt: "2026-07-20T10:00:00+09:00",
    read: true,
    target: { screen: "pay" },
  },
];

export const ALL_READ_NOTIFICATIONS: NotificationItem[] = MIXED_NOTIFICATIONS.map((item) => ({
  ...item,
  read: true,
}));

export const EMPTY_NOTIFICATIONS: NotificationItem[] = [];
