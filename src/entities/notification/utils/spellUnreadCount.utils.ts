import { UNREAD_COUNT_COPY } from "@/entities/notification/consts/unreadCount.const";

export function spellUnreadCount(count: number): string {
  if (count <= 0) {
    return UNREAD_COUNT_COPY.allRead;
  }

  return `안 읽은 알림 ${count}개`;
}
