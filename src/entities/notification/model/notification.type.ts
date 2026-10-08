import { type NOTIFICATION_KINDS } from "@/entities/notification/consts/notification.const";

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationPayload = Record<string, unknown>;

export type Notification = {
  id: string;
  profileId: string;
  kind: NotificationKind;
  payload: NotificationPayload;
  subjectId: string | null;
  createdAt: string;
  readAt: string | null;
  claimedAt: string | null;
  pushAttempts: number;
  pushedAt: string | null;
};

export type PushReachable = {
  profileId: string;
  hasDevice: boolean;
};
