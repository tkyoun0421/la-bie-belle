import { type NOTIFICATION_KINDS } from "@/entities/notification/consts/notification.const";

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationPayload = Record<string, unknown>;
