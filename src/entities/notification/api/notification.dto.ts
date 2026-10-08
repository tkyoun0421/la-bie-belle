import type {
  NotificationKind,
  NotificationPayload,
} from "@/entities/notification/model/notification.type";

export type NotificationRow = {
  id: string;
  profile_id: string;
  kind: NotificationKind;
  payload: NotificationPayload;
  subject_id: string | null;
  created_at: string;
  read_at: string | null;
  claimed_at: string | null;
  push_attempts: number;
  pushed_at: string | null;
};

export type PushReachableRow = {
  profile_id: string;
  has_device: boolean;
};
