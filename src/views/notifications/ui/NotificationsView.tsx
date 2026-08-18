"use client";

import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import { useState, type CSSProperties } from "react";

import {
  groupNotificationsByRecency,
  type NotificationGroupKey,
} from "@/entities/notification/model/notification-group";
import type { NotificationItem } from "@/entities/notification/model/notification-item";
import { Button } from "@/shared/ui/button";
import { NotificationRow } from "@/shared/ui/notification-row";
import { RouterPullToRefresh } from "@/widgets/pull-to-refresh/ui/RouterPullToRefresh";

const GROUP_LABEL: Record<NotificationGroupKey, string> = {
  today: "오늘",
  "this-week": "이번 주",
  earlier: "이전",
};

type NotificationsViewProps = {
  items: readonly NotificationItem[];
  now: Date;
  onNavigate: (item: NotificationItem) => void;
  onMarkRead: (item: NotificationItem) => void;
  onMarkAllRead: () => void;
};

function relativeTime(occurredAt: string, now: Date) {
  return formatDistance(new Date(occurredAt), now, { locale: ko, addSuffix: true });
}

export function NotificationsView({
  items: initialItems,
  now,
  onNavigate,
  onMarkRead,
  onMarkAllRead,
}: NotificationsViewProps) {
  const [items, setItems] = useState<NotificationItem[]>(() => [...initialItems]);
  const hasUnread = items.some((item) => !item.read);
  const groups = groupNotificationsByRecency(items, now);
  const staggerIndexById = new Map(
    groups.flatMap((group) => group.items).map((item, index) => [item.id, index] as const),
  );

  function handleMarkAllRead() {
    setItems((previous) => previous.map((item) => ({ ...item, read: true })));
    onMarkAllRead();
  }

  function handlePress(item: NotificationItem) {
    setItems((previous) =>
      previous.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
    );
    onMarkRead(item);
    onNavigate(item);
  }

  function handleSwipeRead(item: NotificationItem) {
    setItems((previous) =>
      previous.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
    );
    onMarkRead(item);
  }

  return (
    <RouterPullToRefresh>
      <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-nav-safe">
        <div className="flex items-center justify-between">
          <Button variant="tertiary" onClick={handleMarkAllRead} disabled={!hasUnread}>
            모두 읽음
          </Button>
        </div>

        {items.length === 0 ? <p className="typo-body text-text">아직 알림이 없어요</p> : null}

        {groups.map((group) =>
          group.items.length === 0 ? null : (
            <section key={group.key} className="flex flex-col gap-1">
              <h2 className="typo-label text-text">{GROUP_LABEL[group.key]}</h2>
              <div className="flex flex-col">
                {group.items.map((item) => (
                  <NotificationRow
                    key={item.id}
                    title={item.title}
                    body={item.body}
                    relativeTime={relativeTime(item.occurredAt, now)}
                    unread={!item.read}
                    onPress={() => handlePress(item)}
                    onSwipeRead={item.read ? undefined : () => handleSwipeRead(item)}
                    className="motion-stagger-item"
                    style={
                      { "--stagger-index": staggerIndexById.get(item.id) ?? 0 } as CSSProperties
                    }
                  />
                ))}
              </div>
            </section>
          ),
        )}
      </main>
    </RouterPullToRefresh>
  );
}
