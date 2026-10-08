import type {
  NotificationRow,
  PushReachableRow,
} from "@/entities/notification/api/notification.dto";
import type {
  Notification,
  PushReachable,
} from "@/entities/notification/model/notification.type";

export function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    profileId: row.profile_id,
    kind: row.kind,
    payload: row.payload,
    subjectId: row.subject_id,
    createdAt: row.created_at,
    readAt: row.read_at,
    claimedAt: row.claimed_at,
    pushAttempts: row.push_attempts,
    pushedAt: row.pushed_at,
  };
}

export function toPushReachable(row: PushReachableRow): PushReachable {
  return { profileId: row.profile_id, hasDevice: row.has_device };
}
