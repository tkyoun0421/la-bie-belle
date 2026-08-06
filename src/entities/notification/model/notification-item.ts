export type NotificationTarget = { screen: "schedule-detail"; date: string } | { screen: "pay" };

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  occurredAt: string;
  read: boolean;
  target: NotificationTarget;
};
